const express = require("express");
const FacultyService = require("../services/facultyService");
const { authenticate, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const router = express.Router();

function parseId(value, message) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, message);
  }
  return id;
}

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const service = new FacultyService();
    const faculty = service.createFaculty(req.body || {});
    res.status(201).json(faculty);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const service = new FacultyService();
    const faculties = service.listFaculties();
    res.json(faculties);
  })
);

router.put(
  "/:facultyId",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const facultyId = parseId(req.params.facultyId, "Invalid faculty id");
    const service = new FacultyService();
    const faculty = service.updateFaculty(facultyId, req.body || {});
    res.json(faculty);
  })
);

module.exports = router;
