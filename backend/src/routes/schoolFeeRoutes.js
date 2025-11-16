const express = require("express");
const SchoolFeeService = require("../services/schoolFeeService");
const { authenticate, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const router = express.Router();

function parsePaymentId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid payment id supplied");
  }
  return id;
}

router.get(
  "/policies",
  authenticate,
  asyncHandler((req, res) => {
    const service = new SchoolFeeService();
    const policies = service.listPolicies();
    res.json({ items: policies });
  })
);

router.post(
  "/policies",
  authenticate,
  requireRole("admin"),
  asyncHandler((req, res) => {
    const service = new SchoolFeeService();
    const policy = service.upsertPolicy(req.user, req.body || {});
    res.status(201).json(policy);
  })
);

router.get(
  "/payments",
  authenticate,
  asyncHandler((req, res) => {
    const service = new SchoolFeeService();
    const payments = service.listPayments(req.user, req.query || {});
    res.json({ items: payments });
  })
);

router.post(
  "/payments",
  authenticate,
  requireRole("student"),
  asyncHandler((req, res) => {
    const service = new SchoolFeeService();
    const payment = service.createPayment(req.user, req.body || {});
    res.status(201).json(payment);
  })
);

router.post(
  "/payments/:paymentId/approve",
  authenticate,
  requireRole("admin"),
  asyncHandler((req, res) => {
    const paymentId = parsePaymentId(req.params.paymentId);
    const service = new SchoolFeeService();
    const payment = service.approvePayment(paymentId, req.user);
    res.json(payment);
  })
);

router.post(
  "/payments/:paymentId/decline",
  authenticate,
  requireRole("admin"),
  asyncHandler((req, res) => {
    const paymentId = parsePaymentId(req.params.paymentId);
    const service = new SchoolFeeService();
    const payment = service.declinePayment(paymentId, req.user, req.body || {});
    res.json(payment);
  })
);

module.exports = router;
