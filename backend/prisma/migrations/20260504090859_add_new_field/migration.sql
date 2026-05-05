-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('tourist', 'provider', 'admin');

-- CreateEnum
CREATE TYPE "ExperienceCategory" AS ENUM ('HOMESTAY', 'WORKSHOP', 'GUIDE', 'HERITAGE_SITE', 'FOOD_TOUR', 'TREKKING', 'ADVENTURE', 'WELLNESS');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MODERATE', 'HARD');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "full_name" VARCHAR(150) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'tourist',
    "avatar_url" TEXT,
    "phone" VARCHAR(20),
    "bio" TEXT,
    "location" VARCHAR(255),
    "google_id" VARCHAR(255),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "category" "ExperienceCategory" NOT NULL,
    "price_per_person" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "duration_hours" INTEGER NOT NULL,
    "max_guests" INTEGER NOT NULL,
    "location_name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "thumbnail" TEXT,
    "images" TEXT[],
    "panorama_images" TEXT[],
    "street_view_url" TEXT,
    "amenities" TEXT[],
    "languages" TEXT[],
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "community_impact_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trail" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_image" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "total_cost_estimate" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "interests" TEXT[],
    "travel_style" TEXT NOT NULL,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "days" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityImpact" (
    "id" TEXT NOT NULL,
    "families_supported" INTEGER NOT NULL,
    "total_revenue_generated" INTEGER NOT NULL,
    "community_share_percentage" DOUBLE PRECISION NOT NULL,
    "cultural_programs_funded" INTEGER NOT NULL,
    "artisans_employed" INTEGER NOT NULL,
    "heritage_sites_maintained" INTEGER NOT NULL,
    "districts_reached" INTEGER NOT NULL,
    "travelers_served" INTEGER NOT NULL,
    "distribution" JSONB NOT NULL,
    "regional" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "experience_id" UUID NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL,
    "num_guests" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "experiences_provider_id_idx" ON "experiences"("provider_id");

-- CreateIndex
CREATE INDEX "experiences_category_idx" ON "experiences"("category");

-- CreateIndex
CREATE INDEX "experiences_district_idx" ON "experiences"("district");

-- CreateIndex
CREATE INDEX "experiences_province_idx" ON "experiences"("province");

-- CreateIndex
CREATE INDEX "experiences_price_per_person_idx" ON "experiences"("price_per_person");

-- CreateIndex
CREATE INDEX "experiences_duration_hours_idx" ON "experiences"("duration_hours");

-- CreateIndex
CREATE INDEX "experiences_approval_status_idx" ON "experiences"("approval_status");

-- CreateIndex
CREATE UNIQUE INDEX "experiences_provider_id_title_key" ON "experiences"("provider_id", "title");

-- CreateIndex
CREATE INDEX "Trail_is_featured_idx" ON "Trail"("is_featured");

-- CreateIndex
CREATE INDEX "Trail_travel_style_idx" ON "Trail"("travel_style");

-- CreateIndex
CREATE INDEX "Trail_difficulty_idx" ON "Trail"("difficulty");

-- CreateIndex
CREATE INDEX "Review_experience_id_idx" ON "Review"("experience_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_user_id_experience_id_key" ON "Review"("user_id", "experience_id");

-- CreateIndex
CREATE INDEX "Booking_user_id_idx" ON "Booking"("user_id");

-- CreateIndex
CREATE INDEX "Booking_experience_id_idx" ON "Booking"("experience_id");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
