const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const DEFAULT_DB_FILE = path.join(__dirname, "..", "..", "db.sqlite3");

function normalizeDatabaseUrl(rawUrl) {
  if (!rawUrl) {
    return DEFAULT_DB_FILE;
  }
  if (rawUrl.startsWith("sqlite:///")) {
    const relativePath = rawUrl.replace(/^sqlite:\/\//, "");
    return path.resolve(process.cwd(), relativePath.replace(/^\//, ""));
  }
  return path.resolve(process.cwd(), rawUrl);
}

function parseCorsOrigins(value) {
  if (!value) {
    return ["http://localhost:5173"];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  port: Number(process.env.PORT || 8000),
  databaseFile: normalizeDatabaseUrl(process.env.DATABASE_URL),
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  accessTokenExpireMinutes: Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 15),
  refreshTokenExpireMinutes: Number(process.env.REFRESH_TOKEN_EXPIRE_MINUTES || 60 * 24 * 7),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
};
