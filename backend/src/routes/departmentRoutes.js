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
    const department = service.createDepartment(req.body || {});
    res.status(201).json(department);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const service = new FacultyService();
    let facultyId;
    if (req.query.faculty_id !== undefined) {
      facultyId = parseId(req.query.faculty_id, "Invalid faculty_id");
    }
    const departments = service.listDepartments(facultyId);
    res.json(departments);
  })
);

router.put(
  "/:departmentId",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const departmentId = parseId(req.params.departmentId, "Invalid department id");
    const service = new FacultyService();
    const department = service.updateDepartment(departmentId, req.body || {});
    res.json(department);
  })
);

module.exports = router;
