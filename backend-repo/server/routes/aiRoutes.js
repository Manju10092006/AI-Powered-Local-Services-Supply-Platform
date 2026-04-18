const express = require("express");
const {
  suggestService,
  listWorkers,
  trackWorker,
  demoFlow,
  demoRun,
  createBooking,
  listBookings
} = require("../controllers/aiController");

const router = express.Router();

router.post("/suggest", suggestService);
router.post("/demo/flow", demoFlow);
router.post("/demo/run", demoRun);
router.post("/book", createBooking);
router.get("/workers", listWorkers);
router.get("/bookings", listBookings);
router.get("/track/:workerName", trackWorker);

module.exports = router;
