/* GET /api/slots/available — dynamic slots for smart booking */
const express = require("express");
const { bookings, workers, findUserById } = require("../data/store");
const { requireRole } = require("../middleware/auth");
const { generateSlots } = require("../services/slotEngine");

const router = express.Router();
router.use(requireRole("customer"));

router.get("/available", (req, res) => {
  const { date, city, category } = req.query;
  if (!date || !category) {
    return res.status(400).json({ error: "date and category are required (YYYY-MM-DD)" });
  }
  const customer = findUserById(req.userId);
  const result = generateSlots({
    date: String(date),
    city: city || customer?.city || "Hyderabad",
    category: String(category),
    bookings,
    workers,
    membership: customer?.membership
  });
  if (result.error) return res.status(400).json({ error: result.error });
  return res.json(result);
});

module.exports = router;
