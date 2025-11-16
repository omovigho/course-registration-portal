const HttpError = require("../utils/httpError");

function notFoundHandler(req, res, next) {
  next(new HttpError(404, "Resource not found"));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof HttpError) {
    const payload = { detail: err.message };
    if (err.details) {
      payload.details = err.details;
    }
    return res.status(err.status).json(payload);
  }

  // eslint-disable-next-line no-console
  console.error("Unhandled error", err);
  return res.status(500).json({ detail: "Internal server error" });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
