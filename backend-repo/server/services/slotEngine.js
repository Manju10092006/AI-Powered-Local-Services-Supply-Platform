/* Smart slot generation — in-memory store, no SQL */
const { isCategoryMatch } = require("./matchService");

const CATEGORY_DURATION_MINS = {
  "ac-repair": 60,
  cleaning: 120,
  plumbing: 30,
  electrical: 45,
  painting: 240,
  salon: 90,
  carpentry: 60,
  "pest-control": 90,
  appliance: 60,
  shifting: 180,
  interiors: 120,
  default: 60
};

const PEAK_START = 18;
const PEAK_END = 21; // exclusive upper for peak label, 18-21
const NIGHT_START = 21;

function getServiceDurationMinutes(category) {
  const k = String(category || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
  return CATEGORY_DURATION_MINS[k] || CATEGORY_DURATION_MINS.default;
}

function isPlusMember(membership) {
  const m = String(membership || "").toLowerCase();
  return m === "plus" || m === "premium";
}

function isWeekend(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Returns { peakINR, nightINR, weekendINR, labels[] } before membership waiver.
 */
function computeSlotFees(slotStart, slotEnd, membership) {
  const waive = isPlusMember(membership);
  let peakINR = 0;
  let nightINR = 0;
  let weekendINR = 0;
  const labels = [];

  if (isWeekend(slotStart)) {
    weekendINR = 29;
    labels.push("Weekend +₹29");
  }

  const h = slotStart.getHours();
  if (h >= NIGHT_START) {
    nightINR = 99;
    labels.push("Late night +₹99");
  } else if (h >= PEAK_START && h < PEAK_END) {
    peakINR = 49;
    labels.push("Peak +₹49");
  }

  if (waive) {
    return {
      peakINR: 0,
      nightINR: 0,
      weekendINR: 0,
      totalSurchargeINR: 0,
      labels: ["FixMate Plus — surcharges waived"],
      waived: true
    };
  }

  const totalSurchargeINR = peakINR + nightINR + weekendINR;
  return { peakINR, nightINR, weekendINR, totalSurchargeINR, labels, waived: false };
}

function bookingWindow(booking) {
  if (booking.slotStart && booking.slotEnd) {
    return {
      start: new Date(booking.slotStart).getTime(),
      end: new Date(booking.slotEnd).getTime()
    };
  }
  const dur = booking.serviceDurationMins || 60;
  const s = new Date(booking.scheduledAt || booking.createdAt).getTime();
  return { start: s, end: s + dur * 60_000 };
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function workerFreeInSlot(workerId, slotStartMs, slotEndMs, bookings) {
  for (const b of bookings) {
    if (b.workerId !== workerId) continue;
    if (!["scheduled", "confirmed", "assigned", "in-progress"].includes(b.status)) continue;
    const w = bookingWindow(b);
    if (overlaps(slotStartMs, slotEndMs, w.start, w.end)) return false;
  }
  return true;
}

function workerCityMatch(worker, city) {
  if (!city) return true;
  const c = city.toLowerCase().trim();
  return (worker.city || "").toLowerCase() === c;
}

function eligibleWorkersForCategory(city, category, workers) {
  const cat = String(category || "").toLowerCase();
  return workers.filter(w => {
    if (!w.skill && !Array.isArray(w.skills)) return false;
    if (!workerCityMatch(w, city)) return false;
    if (!w.isVerified) return false;
    if (!cat || cat === "grouped") return true;
    return isCategoryMatch(w, category);
  });
}

/**
 * Generate bookable slots for a calendar day.
 * @param {object} opts
 * @returns {Array<object>}
 */
function generateSlots(opts) {
  const {
    date, // YYYY-MM-DD
    city,
    category,
    bookings = [],
    workers = [],
    membership = "free",
    dayStartHour = 9,
    dayEndHour = 22
  } = opts;

  const durationMins = getServiceDurationMinutes(category);
  let eligible = eligibleWorkersForCategory(city, category, workers);
  let onlineEligible = eligible.filter(w => w.isOnline);
  let pool = onlineEligible.length ? onlineEligible : eligible;

  /* If no one matches category in this city (e.g. AC in a city with only cleaners), fall back so slots are bookable */
  if (!pool.length) {
    eligible = workers.filter(w => w.isVerified && workerCityMatch(w, city));
    onlineEligible = eligible.filter(w => w.isOnline);
    pool = onlineEligible.length ? onlineEligible : eligible;
  }
  if (!pool.length) {
    eligible = workers.filter(w => w.isVerified);
    onlineEligible = eligible.filter(w => w.isOnline);
    pool = onlineEligible.length ? onlineEligible : eligible;
  }

  const day = new Date(`${date}T12:00:00`);
  if (Number.isNaN(day.getTime())) return { error: "Invalid date", slots: [] };

  const slots = [];
  const stepMins = durationMins <= 45 ? 30 : 60;

  for (let H = dayStartHour; H <= dayEndHour; H++) {
    for (let M = 0; M < 60; M += stepMins) {
      if (H === dayEndHour && M > 0) break;
      const start = new Date(day);
      start.setHours(H, M, 0, 0);
      const end = new Date(start.getTime() + durationMins * 60_000);
      const endH = end.getHours() + end.getMinutes() / 60;
      if (endH > dayEndHour + 1e-6) continue;

      const slotStartMs = start.getTime();
      const slotEndMs = end.getTime();

      let freeCount = 0;
      for (const w of pool) {
        if (workerFreeInSlot(w.id, slotStartMs, slotEndMs, bookings)) freeCount++;
      }

      const fees = computeSlotFees(start, end, membership);
      const hour = start.getHours();
      const popular = hour >= 16 && hour <= 19;
      const fastFilling = freeCount > 0 && freeCount <= 2 && pool.length >= 3;

      const slotId = `sl_${date}_${H}_${M}_${durationMins}`;

      slots.push({
        slotId,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        label: formatLabel(start, end),
        durationMins,
        remaining: freeCount,
        capacity: pool.length,
        disabled: freeCount === 0,
        fees,
        totalSurchargeINR: fees.totalSurchargeINR || 0,
        badges: {
          popular,
          cheapest: false,
          fastFilling
        }
      });
    }
  }

  const bookable = slots.filter(s => !s.disabled);
  if (bookable.length) {
    const minSurge = Math.min(...bookable.map(s => s.totalSurchargeINR));
    bookable.forEach(s => {
      s.badges.cheapest = s.totalSurchargeINR === minSurge;
    });
  }

  return { slots, durationMins, city, category, date };
}

function formatLabel(start, end) {
  const f = d =>
    d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  return `${f(start)} – ${f(end)}`;
}

function pickWorkerForSlot(slotStartMs, slotEndMs, city, category, bookings, workers) {
  const pool = eligibleWorkersForCategory(city, category, workers);
  const onlineFirst = pool.filter(w => w.isOnline);
  const usePool = onlineFirst.length ? onlineFirst : pool;
  const free = usePool.filter(w => workerFreeInSlot(w.id, slotStartMs, slotEndMs, bookings));
  free.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return free[0] || null;
}

function validateSlotAgainstEngine(body, bookings, workers, customer) {
  const { date, city, category, slotId, slotStart, slotEnd } = body;
  const gen = generateSlots({
    date,
    city: city || customer?.city,
    category,
    bookings,
    workers,
    membership: customer?.membership
  });
  if (gen.error) return { ok: false, error: gen.error };
  const match = gen.slots.find(
    s =>
      (slotId && s.slotId === slotId) ||
      (!slotId && slotStart && slotEnd && s.startISO === slotStart && s.endISO === slotEnd)
  );
  if (!match || match.disabled) return { ok: false, error: "Slot unavailable" };
  return { ok: true, slot: match, gen };
}

module.exports = {
  getServiceDurationMinutes,
  computeSlotFees,
  generateSlots,
  validateSlotAgainstEngine,
  pickWorkerForSlot,
  bookingWindow,
  isPlusMember
};
