import asyncHandler from "../utils/AsyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import prisma from "../utils/PrismaProvider.js";
import { buildImpactSummary } from "../utils/impact.js";

const toBookingResponse = (booking) => ({
  id: booking.id,
  user_id: booking.userId,
  experience_id: booking.experienceId,
  booking_date: booking.bookingDate,
  num_guests: booking.numGuests,
  total_amount: booking.totalAmount,
  currency: booking.currency,
  impact: {
    base_amount: booking.baseAmount || 0,
    tax_amount: booking.taxAmount || 0,
    local_earnings_amount: booking.localEarningsAmount || 0,
    community_fund_amount: booking.communityFundAmount || 0,
    platform_fee_amount: booking.platformFeeAmount || 0,
    operations_amount: booking.operationsAmount || 0,
  },
  status: booking.status.toLowerCase(),
  created_at: booking.createdAt,
  experience: booking.experience
    ? {
        id: booking.experience.id,
        title: booking.experience.title,
        location_name: booking.experience.locationName,
        thumbnail: booking.experience.thumbnail,
        images: booking.experience.images,
      }
    : null,
});

const toCertificateResponse = (certificate) => ({
  id: certificate.id,
  user_id: certificate.userId,
  booking_id: certificate.bookingId,
  experience_id: certificate.experienceId,
  title: certificate.title,
  medal_type: certificate.medalType,
  certificate_code: certificate.certificateCode,
  impact_summary: certificate.impactSummary,
  issued_at: certificate.issuedAt,
  experience: certificate.experience
    ? {
        id: certificate.experience.id,
        title: certificate.experience.title,
        location_name: certificate.experience.locationName,
        district: certificate.experience.district,
        thumbnail: certificate.experience.thumbnail,
      }
    : null,
});

const compactExperience = (experience) => ({
  id: experience.id,
  title: experience.title,
  category: experience.category.toLowerCase(),
  avg_rating: experience.avgRating,
  price_per_person: experience.pricePerPerson,
  location_name: experience.locationName,
  thumbnail: experience.thumbnail,
});

const toTrailResponse = (trail) => ({
  id: trail.id,
  creator_id: trail.creatorId,
  title: trail.title,
  description: trail.description,
  cover_image: trail.coverImage,
  difficulty: trail.difficulty.toLowerCase(),
  duration_days: trail.durationDays,
  total_cost_estimate: trail.totalCostEstimate || 0,
  currency: trail.currency,
  interests: trail.interests || [],
  travel_style: trail.travelStyle,
  is_featured: trail.isFeatured,
  total_bookings: trail.totalBookings,
  avg_rating: trail.avgRating,
  days: Array.isArray(trail.days) ? trail.days : [],
  created_at: trail.createdAt,
  updated_at: trail.updatedAt,
});

const hydrateTrailDays = async (trail) => {
  const days = Array.isArray(trail.days) ? trail.days : [];
  const experienceIds = [
    ...new Set(days.map((day) => day.experience_id || day.experienceId || day.experience?.id).filter(Boolean)),
  ];

  if (!experienceIds.length) return trail;

  const experiences = await prisma.experience.findMany({
    where: { id: { in: experienceIds } },
  });
  const experienceMap = new Map(experiences.map((experience) => [experience.id, experience]));

  return {
    ...trail,
    days: days.map((day) => {
      const experienceId = day.experience_id || day.experienceId || day.experience?.id;
      const experience = experienceMap.get(experienceId);

      if (!experience) return day;

      return {
        ...day,
        experience_id: experience.id,
        experience: compactExperience(experience),
      };
    }),
  };
};

const requireUserId = (req) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  return userId;
};

const GetProfile = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, "User profile retrieved successfully", user));
});

const GetDashboard = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const now = new Date();

  const [user, bookings, savedTrailCount, upcomingCount, impactBookings, certificates] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.booking.findMany({
      where: { userId },
      include: { experience: true },
      orderBy: { bookingDate: "desc" },
      take: 20,
    }),
    prisma.trail.count({ where: { creatorId: userId } }),
    prisma.booking.count({
      where: {
        userId,
        bookingDate: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.booking.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
      include: {
        experience: {
          select: {
            id: true,
            title: true,
            locationName: true,
            thumbnail: true,
            category: true,
            district: true,
            providerId: true,
            pricePerPerson: true,
          },
        },
      },
    }),
    prisma.impactCertificate.findMany({
      where: { userId },
      include: {
        experience: {
          select: {
            id: true,
            title: true,
            locationName: true,
            district: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, "Dashboard fetched successfully", {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      joined_at: user.createdAt,
    },
    role: user.role,
    stats: {
      total_trips: bookings.length,
      upcoming: upcomingCount,
      saved_trails: savedTrailCount,
      completed: bookings.filter((booking) => booking.status === "COMPLETED").length,
    },
    impact: buildImpactSummary(impactBookings),
    certificates: certificates.map(toCertificateResponse),
    bookings: bookings.map(toBookingResponse),
  }));
});

const GetMyImpact = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const [impactBookings, certificates] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
      include: {
        experience: {
          select: {
            id: true,
            title: true,
            locationName: true,
            thumbnail: true,
            category: true,
            district: true,
            providerId: true,
            pricePerPerson: true,
          },
        },
      },
    }),
    prisma.impactCertificate.findMany({
      where: { userId },
      include: {
        experience: {
          select: {
            id: true,
            title: true,
            locationName: true,
            district: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  return res.status(200).json(new ApiResponse(200, "Tourist impact fetched successfully", {
    impact: buildImpactSummary(impactBookings),
    certificates: certificates.map(toCertificateResponse),
  }));
});

const GetSavedTrails = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const trails = await prisma.trail.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, "Saved trails fetched successfully", trails.map(toTrailResponse)));
});

const GetSavedTrailById = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const trail = await prisma.trail.findFirst({
    where: {
      id: req.params.id,
      creatorId: userId,
    },
  });

  if (!trail) {
    throw new ApiError(404, "Saved trail not found");
  }

  const hydratedTrail = await hydrateTrailDays(trail);

  return res.status(200).json(new ApiResponse(200, "Saved trail fetched successfully", toTrailResponse(hydratedTrail)));
});

const DeleteSavedTrail = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const trail = await prisma.trail.findFirst({
    where: {
      id: req.params.id,
      creatorId: userId,
    },
    select: { id: true, title: true },
  });

  if (!trail) {
    throw new ApiError(404, "Saved trail not found");
  }

  await prisma.trail.delete({ where: { id: trail.id } });

  return res.status(200).json(new ApiResponse(200, "Saved trail deleted successfully", trail));
});

export {
  DeleteSavedTrail,
  GetDashboard,
  GetMyImpact,
  GetProfile,
  GetSavedTrailById,
  GetSavedTrails,
};
