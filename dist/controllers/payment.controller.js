"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.PaymentController = void 0;
const stripe_service_1 = require("../services/stripe.service");
const index_1 = require("../db/index");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
const zod_1 = require("zod");
// Validation schemas
const createPaymentIntentSchema = zod_1.z.object({
    amount: zod_1.z.number().min(50), // Minimum $0.50
    currency: zod_1.z.string().default('usd'),
    description: zod_1.z.string().optional(),
    auditId: zod_1.z.string().optional(),
    consultationType: zod_1.z.enum(['basic', 'premium', 'enterprise']).optional(),
});
const createCustomerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().optional(),
});
const createCheckoutSessionSchema = zod_1.z.object({
    priceId: zod_1.z.string(),
    quantity: zod_1.z.number().default(1),
    mode: zod_1.z.enum(['payment', 'subscription']).default('payment'),
    auditId: zod_1.z.string().optional(),
    consultationType: zod_1.z.string().optional(),
});
class PaymentController {
    constructor() {
        // Create payment intent for one-time payments
        this.createPaymentIntent = (0, asyncHandler_1.default)(async (req, res) => {
            const { amount, currency, description, auditId, consultationType } = createPaymentIntentSchema.parse(req.body);
            const metadata = {};
            if (auditId)
                metadata.auditId = auditId;
            if (consultationType)
                metadata.consultationType = consultationType;
            if (req.user?.id)
                metadata.userId = req.user.id;
            const paymentIntent = await stripe_service_1.stripeService.createPaymentIntent({
                amount,
                currency,
                description,
                metadata,
            });
            res.json(new apiResponse_1.ApiResponse(200, {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            }, 'Payment intent created successfully'));
        });
        // Create or get customer
        this.createCustomer = (0, asyncHandler_1.default)(async (req, res) => {
            const { email, name } = createCustomerSchema.parse(req.body);
            // Check if customer already exists
            const existingCustomers = await stripe_service_1.stripeService.listCustomers(email);
            if (existingCustomers.data.length > 0) {
                const customer = existingCustomers.data[0];
                return res.json(new apiResponse_1.ApiResponse(200, {
                    customerId: customer.id,
                    email: customer.email,
                    name: customer.name,
                }, 'Customer retrieved successfully'));
            }
            // Create new customer
            const customer = await stripe_service_1.stripeService.createCustomer({
                email,
                name,
                metadata: {
                    userId: req.user?.id || '',
                    createdAt: new Date().toISOString(),
                },
            });
            res.json(new apiResponse_1.ApiResponse(201, {
                customerId: customer.id,
                email: customer.email,
                name: customer.name,
            }, 'Customer created successfully'));
        });
        // Create checkout session for hosted checkout
        this.createCheckoutSession = (0, asyncHandler_1.default)(async (req, res) => {
            const { priceId, quantity, mode, auditId, consultationType } = createCheckoutSessionSchema.parse(req.body);
            const metadata = {};
            if (auditId)
                metadata.auditId = auditId;
            if (consultationType)
                metadata.consultationType = consultationType;
            if (req.user?.id)
                metadata.userId = req.user.id;
            const successUrl = `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
            const cancelUrl = `${process.env.FRONTEND_URL}/payment/cancel`;
            const session = await stripe_service_1.stripeService.createCheckoutSession({
                customerEmail: req.user?.email,
                lineItems: [{ price: priceId, quantity }],
                mode,
                successUrl,
                cancelUrl,
                metadata,
            });
            res.json(new apiResponse_1.ApiResponse(200, {
                sessionId: session.id,
                url: session.url,
            }, 'Checkout session created successfully'));
        });
        // Get checkout session details
        this.getCheckoutSession = (0, asyncHandler_1.default)(async (req, res) => {
            const { sessionId } = req.params;
            if (!sessionId) {
                throw new apiError_1.ApiError(400, 'Session ID is required');
            }
            const session = await stripe_service_1.stripeService.getCheckoutSession(sessionId);
            res.json(new apiResponse_1.ApiResponse(200, {
                sessionId: session.id,
                paymentStatus: session.payment_status,
                customerEmail: session.customer_email,
                amountTotal: session.amount_total,
                currency: session.currency,
                metadata: session.metadata,
            }, 'Checkout session retrieved successfully'));
        });
        // Handle Stripe webhooks
        this.handleWebhook = (0, asyncHandler_1.default)(async (req, res) => {
            const signature = req.headers['stripe-signature'];
            if (!signature) {
                throw new apiError_1.ApiError(400, 'Missing Stripe signature');
            }
            try {
                const event = stripe_service_1.stripeService.constructWebhookEvent(req.body, signature);
                // Handle different event types
                switch (event.type) {
                    case 'payment_intent.succeeded':
                        await this.handlePaymentIntentSucceeded(event.data.object);
                        break;
                    case 'payment_intent.payment_failed':
                        await this.handlePaymentIntentFailed(event.data.object);
                        break;
                    case 'checkout.session.completed':
                        await this.handleCheckoutSessionCompleted(event.data.object);
                        break;
                    case 'customer.subscription.created':
                        await this.handleSubscriptionCreated(event.data.object);
                        break;
                    case 'customer.subscription.deleted':
                        await this.handleSubscriptionDeleted(event.data.object);
                        break;
                    case 'invoice.payment_succeeded':
                        await this.handleInvoicePaymentSucceeded(event.data.object);
                        break;
                    default:
                        console.log(`Unhandled event type: ${event.type}`);
                }
                res.json(new apiResponse_1.ApiResponse(200, null, 'Webhook processed successfully'));
            }
            catch (error) {
                console.error('Webhook error:', error);
                throw new apiError_1.ApiError(400, 'Webhook signature verification failed');
            }
        });
        // Get customer billing information
        this.getBillingInfo = (0, asyncHandler_1.default)(async (req, res) => {
            const userId = req.user?.id;
            const userEmail = req.user?.email;
            if (!userId || !userEmail) {
                throw new apiError_1.ApiError(401, 'User authentication required');
            }
            try {
                let stripeCustomer;
                let dbCustomer = null;
                // Check if customer exists in our database
                const existingDbCustomer = await index_1.db
                    .select()
                    .from(schema_1.stripeCustomersTable)
                    .where((0, drizzle_orm_1.eq)(schema_1.stripeCustomersTable.userId, userId))
                    .limit(1);
                if (existingDbCustomer.length > 0) {
                    dbCustomer = existingDbCustomer[0];
                    stripeCustomer = await stripe_service_1.stripeService.getCustomer(dbCustomer.stripeCustomerId);
                }
                else {
                    // Find or create in Stripe
                    const existingStripeCustomers = await stripe_service_1.stripeService.listCustomers(userEmail);
                    if (existingStripeCustomers.data.length > 0) {
                        stripeCustomer = existingStripeCustomers.data[0];
                    }
                    else {
                        // Create new Stripe customer
                        stripeCustomer = await stripe_service_1.stripeService.createCustomer({
                            email: userEmail,
                            metadata: { userId },
                        });
                    }
                    // Store in our database
                    const insertResult = await index_1.db
                        .insert(schema_1.stripeCustomersTable)
                        .values({
                        userId,
                        stripeCustomerId: stripeCustomer.id,
                        email: stripeCustomer.email,
                        name: stripeCustomer.name,
                    })
                        .returning();
                    dbCustomer = insertResult[0];
                }
                // Ensure we have both stripeCustomer and dbCustomer
                if (!stripeCustomer || !dbCustomer) {
                    throw new apiError_1.ApiError(500, 'Failed to create or retrieve customer');
                }
                // Get payment history from our database
                const dbPayments = await index_1.db
                    .select()
                    .from(schema_1.paymentsTable)
                    .where((0, drizzle_orm_1.eq)(schema_1.paymentsTable.userId, userId))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.paymentsTable.createdAt));
                // Get subscriptions from our database
                const dbSubscriptions = await index_1.db
                    .select()
                    .from(schema_1.subscriptionsTable)
                    .where((0, drizzle_orm_1.eq)(schema_1.subscriptionsTable.userId, userId))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.subscriptionsTable.createdAt));
                // Get customer's payment methods from Stripe
                const paymentMethods = await stripe_service_1.stripeService.listPaymentMethods(stripeCustomer.id);
                // Get recent invoices from Stripe
                const invoices = await stripe_service_1.stripeService.listInvoices(stripeCustomer.id);
                // Get Stripe subscriptions
                const stripeSubscriptions = await stripe_service_1.stripeService.listSubscriptions(stripeCustomer.id);
                res.json(new apiResponse_1.ApiResponse(200, {
                    customer: {
                        id: stripeCustomer.id,
                        email: stripeCustomer.email,
                        name: stripeCustomer.name,
                    },
                    paymentMethods: paymentMethods.data.map((pm) => ({
                        id: pm.id,
                        type: pm.type,
                        card: pm.card ? {
                            brand: pm.card.brand,
                            last4: pm.card.last4,
                            expMonth: pm.card.exp_month,
                            expYear: pm.card.exp_year,
                        } : null,
                    })),
                    // Payment history from our database
                    payments: dbPayments.map((payment) => ({
                        id: payment.id,
                        stripePaymentIntentId: payment.stripePaymentIntentId,
                        amount: payment.amount,
                        currency: payment.currency,
                        status: payment.status,
                        description: payment.description,
                        metadata: payment.metadata ? JSON.parse(payment.metadata) : {},
                        createdAt: payment.createdAt,
                        auditId: payment.auditId,
                    })),
                    // Invoices from Stripe
                    invoices: invoices.data.map((invoice) => ({
                        id: invoice.id,
                        number: invoice.number,
                        status: invoice.status,
                        amountPaid: invoice.amount_paid,
                        amountDue: invoice.amount_due,
                        currency: invoice.currency,
                        created: invoice.created,
                        dueDate: invoice.due_date,
                        hostedInvoiceUrl: invoice.hosted_invoice_url,
                        invoicePdf: invoice.invoice_pdf,
                    })),
                    // Subscriptions from our database + Stripe
                    subscriptions: dbSubscriptions.map((sub) => ({
                        id: sub.id,
                        stripeSubscriptionId: sub.stripeSubscriptionId,
                        status: sub.status,
                        currentPeriodStart: sub.currentPeriodStart,
                        currentPeriodEnd: sub.currentPeriodEnd,
                        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                        metadata: sub.metadata ? JSON.parse(sub.metadata) : {},
                        createdAt: sub.createdAt,
                    })),
                }, 'Billing information retrieved successfully'));
            }
            catch (error) {
                console.error('Billing info error:', error);
                throw new apiError_1.ApiError(500, 'Failed to retrieve billing information');
            }
        });
        // Create Stripe Customer Portal session
        this.createPortalSession = (0, asyncHandler_1.default)(async (req, res) => {
            const userId = req.user?.id;
            const userEmail = req.user?.email;
            if (!userId || !userEmail) {
                throw new apiError_1.ApiError(401, 'User authentication required');
            }
            try {
                // Find existing customer
                const existingCustomers = await stripe_service_1.stripeService.listCustomers(userEmail);
                if (existingCustomers.data.length === 0) {
                    throw new apiError_1.ApiError(404, 'No billing account found');
                }
                const customer = existingCustomers.data[0];
                const returnUrl = `${process.env.FRONTEND_URL}/dashboard/billing`;
                const portalSession = await stripe_service_1.stripeService.createPortalSession(customer.id, returnUrl);
                res.json(new apiResponse_1.ApiResponse(200, {
                    url: portalSession.url,
                }, 'Portal session created successfully'));
            }
            catch (error) {
                console.error('Portal session error:', error);
                throw new apiError_1.ApiError(500, 'Failed to create portal session');
            }
        });
        // Get payment methods for a customer
        this.getPaymentMethods = (0, asyncHandler_1.default)(async (req, res) => {
            const { customerId } = req.params;
            if (!customerId) {
                throw new apiError_1.ApiError(400, 'Customer ID is required');
            }
            const paymentMethods = await stripe_service_1.stripeService.listPaymentMethods(customerId);
            res.json(new apiResponse_1.ApiResponse(200, {
                paymentMethods: paymentMethods.data.map((pm) => ({
                    id: pm.id,
                    type: pm.type,
                    card: pm.card ? {
                        brand: pm.card.brand,
                        last4: pm.card.last4,
                        expMonth: pm.card.exp_month,
                        expYear: pm.card.exp_year,
                    } : null,
                })),
            }, 'Payment methods retrieved successfully'));
        });
    }
    // Private webhook handlers
    async handlePaymentIntentSucceeded(paymentIntent) {
        console.log('Payment succeeded:', paymentIntent.id);
        try {
            const metadata = paymentIntent.metadata;
            const userId = metadata.userId;
            if (userId) {
                // Store payment record in database
                await index_1.db.insert(schema_1.paymentsTable).values({
                    userId,
                    auditId: metadata.auditId || null,
                    stripePaymentIntentId: paymentIntent.id,
                    stripeCustomerId: paymentIntent.customer,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    status: 'succeeded',
                    description: paymentIntent.description || 'Payment for Credex service',
                    metadata: JSON.stringify({
                        consultationType: metadata.consultationType,
                        productType: metadata.productType,
                        auditId: metadata.auditId,
                    }),
                });
                console.log(`Payment ${paymentIntent.id} stored in database for user ${userId}`);
                // Handle specific service types
                if (metadata.consultationType) {
                    console.log(`Consultation ${metadata.consultationType} payment completed for user ${userId}`);
                    // TODO: Create consultation booking, send confirmation email
                }
                if (metadata.auditId) {
                    console.log(`Audit ${metadata.auditId} payment completed`);
                    // TODO: Unlock premium audit features
                }
            }
        }
        catch (error) {
            console.error('Error storing payment in database:', error);
        }
    }
    async handlePaymentIntentFailed(paymentIntent) {
        console.log('Payment failed:', paymentIntent.id);
        try {
            const metadata = paymentIntent.metadata;
            const userId = metadata.userId;
            if (userId) {
                // Update or create payment record with failed status
                await index_1.db.insert(schema_1.paymentsTable).values({
                    userId,
                    auditId: metadata.auditId || null,
                    stripePaymentIntentId: paymentIntent.id,
                    stripeCustomerId: paymentIntent.customer,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    status: 'failed',
                    description: paymentIntent.description || 'Failed payment for Credex service',
                    metadata: JSON.stringify(metadata),
                });
                console.log(`Failed payment ${paymentIntent.id} recorded for user ${userId}`);
                // TODO: Send failure notification to user
            }
        }
        catch (error) {
            console.error('Error storing failed payment in database:', error);
        }
    }
    async handleCheckoutSessionCompleted(session) {
        console.log('Checkout session completed:', session.id);
        try {
            const metadata = session.metadata;
            const userId = metadata.userId;
            if (userId && session.payment_intent) {
                // The payment intent succeeded event will handle storing the payment
                console.log(`Checkout completed for user ${userId}, payment intent: ${session.payment_intent}`);
            }
        }
        catch (error) {
            console.error('Error handling checkout session completion:', error);
        }
    }
    async handleSubscriptionCreated(subscription) {
        console.log('Subscription created:', subscription.id);
        try {
            const customerId = subscription.customer;
            // Find user by Stripe customer ID
            const dbCustomer = await index_1.db
                .select()
                .from(schema_1.stripeCustomersTable)
                .where((0, drizzle_orm_1.eq)(schema_1.stripeCustomersTable.stripeCustomerId, customerId))
                .limit(1);
            if (dbCustomer.length > 0) {
                const userId = dbCustomer[0].userId;
                // Store subscription in database
                await index_1.db.insert(schema_1.subscriptionsTable).values({
                    userId,
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: customerId,
                    stripePriceId: subscription.items.data[0].price.id,
                    status: subscription.status,
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    metadata: JSON.stringify(subscription.metadata),
                });
                console.log(`Subscription ${subscription.id} stored for user ${userId}`);
            }
        }
        catch (error) {
            console.error('Error storing subscription in database:', error);
        }
    }
    async handleSubscriptionDeleted(subscription) {
        console.log('Subscription deleted:', subscription.id);
        try {
            // Update subscription status in database
            await index_1.db
                .update(schema_1.subscriptionsTable)
                .set({
                status: 'canceled',
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.subscriptionsTable.stripeSubscriptionId, subscription.id));
            console.log(`Subscription ${subscription.id} marked as canceled in database`);
        }
        catch (error) {
            console.error('Error updating subscription in database:', error);
        }
    }
    async handleInvoicePaymentSucceeded(invoice) {
        console.log('Invoice payment succeeded:', invoice.id);
        try {
            const customerId = invoice.customer;
            // Find user by Stripe customer ID
            const dbCustomer = await index_1.db
                .select()
                .from(schema_1.stripeCustomersTable)
                .where((0, drizzle_orm_1.eq)(schema_1.stripeCustomersTable.stripeCustomerId, customerId))
                .limit(1);
            if (dbCustomer.length > 0) {
                const userId = dbCustomer[0].userId;
                console.log(`Invoice payment succeeded for user ${userId}`);
                // TODO: Handle recurring payment success, extend subscription, etc.
            }
        }
        catch (error) {
            console.error('Error handling invoice payment success:', error);
        }
    }
}
exports.PaymentController = PaymentController;
exports.paymentController = new PaymentController();
//# sourceMappingURL=payment.controller.js.map