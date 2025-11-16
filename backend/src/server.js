const http = require("http");
const app = require("./app");
const settings = require("./config/settings");
const { closeDatabase } = require("./db/database");

const server = http.createServer(app);

server.listen(settings.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${settings.port}`);
});

function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down gracefully.`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
