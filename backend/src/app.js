const express = require("express");
const cors = require("cors");
const settings = require("./config/settings");
const { runMigrations } = require("./db/migrations");
const { getDatabase } = require("./db/database");
const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

runMigrations();

const app = express();

app.use(
  cors({
    origin: settings.corsOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (req, res, next) => {
  try {
    const db = getDatabase();
    db.prepare("SELECT 1").get();
    res.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.use(apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
