CREATE INDEX "form_submissions_user_id_idx" ON "form_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "form_submissions_subscription_id_idx" ON "form_submissions" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "letter_status_submission_sent_idx" ON "letter_status" USING btree ("submission_id","sent");--> statement-breakpoint
CREATE INDEX "otps_lookup_idx" ON "otps" USING btree ("phone","type","verified","expires_at");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_status_idx" ON "subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "subscriptions_razorpay_order_id_idx" ON "subscriptions" USING btree ("razorpay_order_id");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_phone_unique" UNIQUE("phone");