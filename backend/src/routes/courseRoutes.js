const express = require("express");
const CourseService = require("../services/courseService");
const { authenticate, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const router = express.Router();

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid course id");
  }
  return id;
}

router.post(
  "/",
  authenticate,
  requireRole("lecturer", "admin"),
  asyncHandler(async (req, res) => {
    const service = new CourseService();
    const course = service.createCourse(req.user, req.body || {});
    res.status(201).json(course);
  })
);

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const service = new CourseService();
    const filters = {
      faculty_id: req.query.faculty_id ?? req.query.facultyId,
      department_id: req.query.department_id ?? req.query.departmentId,
      level: req.query.level,
      include_inactive: req.query.include_inactive ?? req.query.includeInactive,
      is_active: req.query.is_active ?? req.query.isActive,
    };
    const courses = service.listCourses(req.user, filters);
    res.json({ items: courses });
  })
);

router.put(
  "/:courseId",
  authenticate,
  requireRole("lecturer", "admin"),
  asyncHandler(async (req, res) => {
    const courseId = parseId(req.params.courseId);
    const service = new CourseService();
    const course = service.updateCourse(courseId, req.user, req.body || {});
    res.json(course);
  })
);

module.exports = router;
