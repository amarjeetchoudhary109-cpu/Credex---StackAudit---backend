"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
// Public routes (no authentication required)
router.post('/webhook', express_2.default.raw({ type: 'application/json' }), // Raw body for webhook signature verification
payment_controller_1.paymentController.handleWebhook);
// Protected routes (authentication required)
router.use(auth_middleware_1.requireAuth); // Apply authentication to all routes below
// Payment intents
router.post('/payment-intent', payment_controller_1.paymentController.createPaymentIntent);
// Customers
router.post('/customer', payment_controller_1.paymentController.createCustomer);
router.get('/customer/:customerId/payment-methods', payment_controller_1.paymentController.getPaymentMethods);
// Checkout sessions
router.post('/checkout-session', payment_controller_1.paymentController.createCheckoutSession);
router.get('/checkout-session/:sessionId', payment_controller_1.paymentController.getCheckoutSession);
// Billing information
router.get('/billing', payment_controller_1.paymentController.getBillingInfo);
router.post('/portal-session', payment_controller_1.paymentController.createPortalSession);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map