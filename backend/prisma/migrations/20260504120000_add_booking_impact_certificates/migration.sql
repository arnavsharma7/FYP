-- Add booking-level impact accounting fields.
ALTER TABLE "Booking"
ADD COLUMN "base_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tax_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "local_earnings_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "community_fund_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "platform_fee_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "operations_amount" INTEGER NOT NULL DEFAULT 0;

-- Store tourist achievement medals issued after completed trips.
CREATE TABLE "impact_certificates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "medal_type" TEXT NOT NULL,
    "certificate_code" TEXT NOT NULL,
    "impact_summary" JSONB NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impact_certificates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "impact_certificates_booking_id_key" ON "impact_certificates"("booking_id");
CREATE UNIQUE INDEX "impact_certificates_certificate_code_key" ON "impact_certificates"("certificate_code");
CREATE INDEX "impact_certificates_user_id_idx" ON "impact_certificates"("user_id");
CREATE INDEX "impact_certificates_experience_id_idx" ON "impact_certificates"("experience_id");

ALTER TABLE "impact_certificates" ADD CONSTRAINT "impact_certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "impact_certificates" ADD CONSTRAINT "impact_certificates_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "impact_certificates" ADD CONSTRAINT "impact_certificates_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
