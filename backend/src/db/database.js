const Database = require("better-sqlite3");
const settings = require("../config/settings");

let databaseInstance;

function getDatabase() {
  if (!databaseInstance) {
    databaseInstance = new Database(settings.databaseFile);
    databaseInstance.pragma("foreign_keys = ON");
  }
  return databaseInstance;
}

function closeDatabase() {
  if (databaseInstance) {
    databaseInstance.close();
    databaseInstance = undefined;
  }
}

module.exports = {
  getDatabase,
  closeDatabase,
};
