import { Response } from 'express';
import { CheckoutRequest } from '../../middleware/security/verifyCheckoutToken';
import * as subscriptionService from './subscription.service';
import { createOrderSchema, verifyPaymentSchema } from './subscription.requestHygiene';

// Thin wrappers around the existing Razorpay service functions — no signature-verification
// or order-creation logic is duplicated here, only the auth source differs: a magic-link
// checkout session (`verifyCheckoutToken`) instead of a full app login (`verifyToken`).

export async function checkoutCreateOrderController(req: CheckoutRequest, res: Response) {
  const data = createOrderSchema.parse(req.body);
  const result = await subscriptionService.createOrder(
    req.checkoutUserId!,
    data.tier,
    req.magicLinkTokenId,
  );
  res.status(201).json(result);
}

export async function checkoutVerifyPaymentController(req: CheckoutRequest, res: Response) {
  const data = verifyPaymentSchema.parse(req.body);
  const result = await subscriptionService.verifyPayment(
    req.checkoutUserId!,
    data.razorpayOrderId,
    data.razorpayPaymentId,
    data.razorpaySignature,
  );
  res.json(result);
}
