/**
 * FixMate persistent cart (localStorage) — shared by service listing + cart page.
 */
(function () {
  const CART_KEY = "fixmate_cart_v2";

  function load() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return {};
      const o = JSON.parse(raw);
      return o && typeof o === "object" ? o : {};
    } catch {
      return {};
    }
  }

  function save(obj) {
    localStorage.setItem(CART_KEY, JSON.stringify(obj || {}));
    window.dispatchEvent(new CustomEvent("fixmate-cart-changed"));
  }

  function getCount() {
    return Object.values(load()).reduce((a, q) => a + (Number(q) || 0), 0);
  }

  function updateNavBadge() {
    const el = document.getElementById("nav-cart-count");
    if (el) {
      const n = getCount();
      el.textContent = String(n);
      el.style.display = n > 0 ? "inline-flex" : "none";
    }
  }

  window.FixmateCart = { load, save, getCount, updateNavBadge };

  window.addEventListener("fixmate-cart-changed", () => FixmateCart.updateNavBadge());
  document.addEventListener("DOMContentLoaded", () => FixmateCart.updateNavBadge());
})();
