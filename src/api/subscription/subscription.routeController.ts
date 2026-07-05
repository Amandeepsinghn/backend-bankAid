import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/security/verifyToken';
import * as subscriptionService from './subscription.service';
import { createOrderSchema, verifyPaymentSchema } from './subscription.requestHygiene';

export async function getPlansController(_req: Request, res: Response) {
  const plans = subscriptionService.getPlans();
  res.json(plans);
}

export async function createOrderController(req: AuthRequest, res: Response) {
  const data = createOrderSchema.parse(req.body);
  const result = await subscriptionService.createOrder(req.userId!, data.tier);
  res.status(201).json(result);
}

export async function verifyPaymentController(req: AuthRequest, res: Response) {
  const data = verifyPaymentSchema.parse(req.body);
  const result = await subscriptionService.verifyPayment(
    req.userId!,
    data.razorpayOrderId,
    data.razorpayPaymentId,
    data.razorpaySignature,
  );
  res.json(result);
}

export async function getStatusController(req: AuthRequest, res: Response) {
  const result = await subscriptionService.getSubscriptionStatus(req.userId!);
  res.json(result);
}

export async function webhookController(req: Request, res: Response) {
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  const result = await subscriptionService.handleRazorpayWebhook(req.body as Buffer, signature);
  res.json(result);
}
