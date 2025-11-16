const express = require("express");
const { authenticate } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const RegistrationService = require("../services/registrationService");
const HttpError = require("../utils/httpError");

const router = express.Router();

const PDFDocument = require('pdfkit');
const stream = require('stream');

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
  asyncHandler(async (req, res) => {
    const service = new RegistrationService();
    const registration = service.createRegistration(req.user, req.body || {});
    res.status(201).json(registration);
  })
);

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const service = new RegistrationService();
    const registrations = service.listRegistrationsForStudent(req.user);
    res.json(registrations);
  })
);

router.get(
  "/:registrationId",
  authenticate,
  asyncHandler(async (req, res) => {
    const registrationId = parseId(req.params.registrationId, "Invalid registration id");
    const service = new RegistrationService();
    const registration = service.getRegistrationWithItems(registrationId);
    if (registration.student_id !== req.user.id && req.user.role !== "admin") {
      throw new HttpError(403, "Not allowed to view this registration");
    }
    res.json(registration);
  })
);

// Download registration as PDF
router.get(
  "/:registrationId/pdf",
  authenticate,
  asyncHandler(async (req, res) => {
    const registrationId = parseId(req.params.registrationId, "Invalid registration id");
    const service = new RegistrationService();
    const registration = service.getRegistrationWithItems(registrationId);
    if (registration.student_id !== req.user.id && req.user.role !== "admin") {
      throw new HttpError(403, "Not allowed to view this registration");
    }

    // Build a simple PDF in-memory
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const passthrough = new stream.PassThrough();
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=registration-${registration.id}.pdf`);
      res.send(pdfData);
    });

    // Header
    doc.fontSize(18).text('Course Registration', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Registration ID: ${registration.id}`);
    doc.text(`Student ID: ${registration.student_id}`);
    doc.text(`Academic year ID: ${registration.academic_year_id}`);
    doc.text(`Submitted: ${registration.submitted ? 'Yes' : 'No'}`);
    if (registration.submitted_at) {
      doc.text(`Submitted at: ${registration.submitted_at}`);
    }
    doc.moveDown();

    doc.fontSize(14).text('Courses', { underline: true });
    doc.moveDown(0.5);

    if (!registration.items || registration.items.length === 0) {
      doc.fontSize(12).text('No courses in this registration');
    } else {
      registration.items.forEach((item, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${item.course_code_snapshot} - ${item.course_name_snapshot}`);
      });
    }

    doc.end();
  })
);

router.post(
  "/:registrationId/items",
  authenticate,
  asyncHandler(async (req, res) => {
    const registrationId = parseId(req.params.registrationId, "Invalid registration id");
    const service = new RegistrationService();
    const item = service.addItem(req.user, registrationId, req.body || {});
    res.status(201).json(item);
  })
);

router.delete(
  "/items/:itemId",
  authenticate,
  asyncHandler(async (req, res) => {
    const itemId = parseId(req.params.itemId, "Invalid registration item id");
    const service = new RegistrationService();
    const item = service.removeItem(req.user, itemId);
    res.json(item);
  })
);

router.post(
  "/:registrationId/submit",
  authenticate,
  asyncHandler(async (req, res) => {
    const registrationId = parseId(req.params.registrationId, "Invalid registration id");
    const service = new RegistrationService();
    const registration = service.submitRegistration(req.user, registrationId, req.body || {});
    res.json(registration);
  })
);

module.exports = router;
