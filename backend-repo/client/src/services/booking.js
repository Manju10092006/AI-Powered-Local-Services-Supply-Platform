const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// import route
const bookingRoutes = require("./routes/booking");

// use route
app.use("/booking", bookingRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(5000, () => {
  console.log("Server running");
});