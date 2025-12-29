# Payment & EmailJS Integration

This document describes how to configure Razorpay and EmailJS for local testing and production.

## Required environment variables

- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET (set this in Razorpay webhook configuration)
- EMAILJS_SERVICE_ID
- EMAILJS_TEMPLATE_ID
- EMAILJS_USER_ID
- JWT_SECRET

Add these to your environment or `.env.local` when running locally.

## Razorpay

- Use the `POST /api/payment/create-order` endpoint to create an order. It expects `{ plan: 'standard'|'premium' }` in the body and returns `order` and `keyId`.
- The client triggers Razorpay checkout using the returned `order.id` and `keyId`.
- After payment completes, the client calls `POST /api/payment/verify` with `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature` to verify and update the user's subscription.
- Configure a webhook in Razorpay to point to `/api/payment/webhook` and set the webhook secret as `RAZORPAY_WEBHOOK_SECRET`.

## EmailJS

- The utility is in `src/lib/emailjs.ts` and exposes `sendEmailJS(templateParams)` which posts to EmailJS API using `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, and `EMAILJS_USER_ID`.
- The project sends welcome emails on registration and Google signup. A support endpoint `POST /api/support/contact` also forwards user messages to the configured EmailJS template. The template should accept the following params:
  - `subject`
  - `message`
  - `from_email`
  - `from_name`

## Testing

- Use Razorpay test keys and simulate a payment using the checkout test card (as per Razorpay docs).
- Use EmailJS test template and ensure your service/template IDs map to the template variables used by the app.

## Notes

- Payment records are stored in the `payments` collection when verification or webhook processing occurs.
- Analyses are saved to MongoDB (server auth) or Firestore (Firebase auth) and can be reviewed in the Dashboard.
