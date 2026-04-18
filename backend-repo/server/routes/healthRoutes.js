const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "FixMate AI",
    uptime: process.uptime(),
    features: {
      ai: true,
      fallback: true,
      tracking: true,
      booking: true
    }
  });
});

module.exports = router;

