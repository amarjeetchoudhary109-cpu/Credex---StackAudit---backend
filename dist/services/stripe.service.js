"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeService = exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
let stripe;
function getStripe() {
    if (!stripe) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is required');
        }
        stripe = new stripe_1.default(secretKey, {
            apiVersion: '2024-06-20',
        });
    }
    return stripe;
}
class StripeService {
    // Payment Intents for one-time payments
    async createPaymentIntent(data) {
        return await getStripe().paymentIntents.create({
            amount: data.amount,
            currency: data.currency,
            customer: data.customerId,
            metadata: data.metadata || {},
            description: data.description,
            automatic_payment_methods: {
                enabled: true,
            },
        });
    }
    async confirmPaymentIntent(paymentIntentId) {
        return await getStripe().paymentIntents.confirm(paymentIntentId);
    }
    async getPaymentIntent(paymentIntentId) {
        return await getStripe().paymentIntents.retrieve(paymentIntentId);
    }
    // Customers
    async createCustomer(data) {
        return await getStripe().customers.create({
            email: data.email,
            name: data.name,
            metadata: data.metadata || {},
        });
    }
    async getCustomer(customerId) {
        return await getStripe().customers.retrieve(customerId);
    }
    async updateCustomer(customerId, data) {
        return await getStripe().customers.update(customerId, {
            email: data.email,
            name: data.name,
            metadata: data.metadata,
        });
    }
    // Subscriptions (for recurring payments like consultations)
    async createSubscription(data) {
        return await getStripe().subscriptions.create({
            customer: data.customerId,
            items: [{ price: data.priceId }],
            metadata: data.metadata || {},
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });
    }
    async getSubscription(subscriptionId) {
        return await getStripe().subscriptions.retrieve(subscriptionId);
    }
    async cancelSubscription(subscriptionId) {
        return await getStripe().subscriptions.cancel(subscriptionId);
    }
    // Products and Prices
    async createProduct(name, description) {
        return await getStripe().products.create({
            name,
            description,
        });
    }
    async createPrice(productId, amount, currency = 'usd', recurring) {
        return await getStripe().prices.create({
            product: productId,
            unit_amount: amount,
            currency,
            recurring,
        });
    }
    // Checkout Sessions (for hosted checkout)
    async createCheckoutSession(data) {
        return await getStripe().checkout.sessions.create({
            customer: data.customerId,
            customer_email: data.customerEmail,
            line_items: data.lineItems,
            mode: data.mode,
            success_url: data.successUrl,
            cancel_url: data.cancelUrl,
            metadata: data.metadata || {},
            allow_promotion_codes: true,
        });
    }
    async getCheckoutSession(sessionId) {
        return await getStripe().checkout.sessions.retrieve(sessionId);
    }
    // Webhook handling
    constructWebhookEvent(payload, signature) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
    }
    // Utility methods
    async listCustomers(email) {
        return await getStripe().customers.list({
            email,
            limit: 100,
        });
    }
    async searchCustomers(query) {
        return await getStripe().customers.search({
            query,
        });
    }
    // Refunds
    async createRefund(paymentIntentId, amount) {
        return await getStripe().refunds.create({
            payment_intent: paymentIntentId,
            amount,
        });
    }
    // Payment Methods
    async attachPaymentMethod(paymentMethodId, customerId) {
        return await getStripe().paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });
    }
    async detachPaymentMethod(paymentMethodId) {
        return await getStripe().paymentMethods.detach(paymentMethodId);
    }
    async listPaymentMethods(customerId, type = 'card') {
        return await getStripe().paymentMethods.list({
            customer: customerId,
            type: type,
        });
    }
    // Invoices
    async listInvoices(customerId) {
        return await getStripe().invoices.list({
            customer: customerId,
            limit: 100,
        });
    }
    async getInvoice(invoiceId) {
        return await getStripe().invoices.retrieve(invoiceId);
    }
    // Subscriptions
    async listSubscriptions(customerId) {
        return await getStripe().subscriptions.list({
            customer: customerId,
            limit: 100,
        });
    }
    // Customer Portal
    async createPortalSession(customerId, returnUrl) {
        return await getStripe().billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });
    }
}
exports.StripeService = StripeService;
exports.stripeService = new StripeService();
//# sourceMappingURL=stripe.service.js.map