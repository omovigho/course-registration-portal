const { runMigrations } = require("../db/migrations");

try {
  runMigrations();
  // eslint-disable-next-line no-console
  console.log("Database migrations applied successfully.");
  process.exit(0);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error("Failed to run migrations", error);
  process.exit(1);
}
