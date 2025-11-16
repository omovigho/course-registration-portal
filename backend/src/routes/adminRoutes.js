const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const UserService = require("../services/userService");
const RegistrationService = require("../services/registrationService");
const HttpError = require("../utils/httpError");
const { studentsCsvStream } = require("../utils/csv");

const router = express.Router();

function parseId(value, message) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, message);
  }
  return id;
}

router.get(
  "/students",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const service = new UserService();
    const filters = {};
    if (req.query.name) {
      filters.name = String(req.query.name);
    }
    if (req.query.matric_no) {
      filters.matric_no = String(req.query.matric_no);
    }
    if (req.query.faculty_id !== undefined) {
      filters.faculty_id = parseId(req.query.faculty_id, "Invalid faculty_id");
    }
    if (req.query.department_id !== undefined) {
      filters.department_id = parseId(req.query.department_id, "Invalid department_id");
    }
    const students = service.listStudents(filters);
    res.json(
      students.map((item) => ({
        student_profile: item.student_profile,
        user: item.user,
        faculty: item.faculty,
        department: item.department,
      }))
    );
  })
);

router.get(
  "/registrations/submitted",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const service = new RegistrationService();
    const filters = {};

    if (req.query.academic_year_id !== undefined && req.query.academic_year_id !== "") {
      filters.academic_year_id = parseId(req.query.academic_year_id, "Invalid academic_year_id");
    }

    const registrations = service.listSubmittedRegistrations(filters);
    res.json(registrations);
  })
);

router.get(
  "/students/export",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const service = new UserService();
    const rows = service.exportStudentsCsvRows();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=students.csv");
    studentsCsvStream(rows).pipe(res);
  })
);

function updateRoleHandler(req, res) {
  const userId = parseId(req.params.userId, "Invalid user id");
  const role = req.body?.role;
  if (!role) {
    throw new HttpError(400, "role is required");
  }
  const service = new UserService();
  const user = service.updateRole(userId, role);
  res.json({ id: user.id, role: user.role });
}

router.post(
  "/users/:userId/promote",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => updateRoleHandler(req, res))
);

router.post(
  "/users/:userId/demote",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => updateRoleHandler(req, res))
);

module.exports = router;
