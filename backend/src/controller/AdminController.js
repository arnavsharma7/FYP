import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../utils/PrismaProvider.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_APPROVAL_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"]);

const clampPagination = (query, defaultLimit = 10) => {
  const limit = Math.max(1, Math.min(Number(query.limit) || defaultLimit, 50));
  const offset = Math.max(0, Number(query.offset) || 0);

  return { limit, offset };
};

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const formatDayKey = (date) => date.toISOString().slice(0, 10);

const buildDailyBuckets = (days) => {
  const today = startOfDay(new Date());

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));

    return {
      date: formatDayKey(date),
      users: 0,
      experiences: 0,
      bookings: 0,
      revenue: 0,
    };
  });
};

const toUserResponse = (user) => ({
  id: user.id,
  full_name: user.fullName,
  email: user.email,
  role: user.role,
  phone: user.phone,
  location: user.location,
  is_verified: user.isVerified,
  joined_at: user.createdAt,
  updated_at: user.updatedAt,
  counts: {
    experiences: user._count?.experiences || 0,
    bookings: user._count?.bookings || 0,
    reviews: user._count?.reviews || 0,
  },
  latest_booking: user.bookings?.[0]
    ? {
        id: user.bookings[0].id,
        booking_date: user.bookings[0].bookingDate,
        created_at: user.bookings[0].createdAt,
        status: user.bookings[0].status.toLowerCase(),
        total_amount: user.bookings[0].totalAmount,
        currency: user.bookings[0].currency,
        experience: user.bookings[0].experience
          ? {
              id: user.bookings[0].experience.id,
              title: user.bookings[0].experience.title,
            }
          : null,
      }
    : null,
});

const toExperienceResponse = (experience) => ({
  id: experience.id,
  provider_id: experience.providerId,
  title: experience.title,
  description: experience.description,
  short_description: experience.shortDescription,
  category: experience.category.toLowerCase(),
  price_per_person: experience.pricePerPerson,
  currency: experience.currency,
  duration_hours: experience.durationHours,
  max_guests: experience.maxGuests,
  location_name: experience.locationName,
  latitude: experience.latitude,
  longitude: experience.longitude,
  district: experience.district,
  province: experience.province,
  thumbnail: experience.thumbnail,
  images: experience.images,
  panorama_images: experience.panoramaImages,
  street_view_url: experience.streetViewUrl,
  amenities: experience.amenities,
  languages: experience.languages,
  approval_status: experience.approvalStatus,
  is_verified: experience.isVerified,
  avg_rating: experience.avgRating,
  total_reviews: experience.totalReviews,
  total_bookings: experience.totalBookings,
  community_impact_score: experience.communityImpactScore,
  created_at: experience.createdAt,
  updated_at: experience.updatedAt,
  provider: experience.provider
    ? {
        id: experience.provider.id,
        full_name: experience.provider.fullName,
        email: experience.provider.email,
      }
    : null,
  counts: {
    bookings: experience._count?.bookings || 0,
    reviews: experience._count?.reviews || 0,
  },
});

const GetAdminSummary = asyncHandler(async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    providers,
    tourists,
    totalExperiences,
    pendingExperiences,
    approvedExperiences,
    totalBookings,
    monthlyRevenue,
    latestUsers,
    latestExperiences,
    latestBookings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "provider" } }),
    prisma.user.count({ where: { role: "tourist" } }),
    prisma.experience.count(),
    prisma.experience.count({ where: { approvalStatus: "PENDING" } }),
    prisma.experience.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.booking.count(),
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    }),
    prisma.experience.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { provider: { select: { id: true, fullName: true, email: true } } },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        experience: { select: { id: true, title: true } },
      },
    }),
  ]);

  const recentActivity = [
    ...latestUsers.map((user) => ({
      type: "user",
      action: "User joined",
      detail: `${user.fullName} (${user.role})`,
      created_at: user.createdAt,
    })),
    ...latestExperiences.map((experience) => ({
      type: "experience",
      action: experience.approvalStatus === "PENDING" ? "Experience awaiting approval" : "Experience added",
      detail: `${experience.title} by ${experience.provider?.fullName || "Unknown provider"}`,
      created_at: experience.createdAt,
    })),
    ...latestBookings.map((booking) => ({
      type: "booking",
      action: "Booking created",
      detail: `${booking.user?.fullName || "Traveler"} booked ${booking.experience?.title || "experience"}`,
      created_at: booking.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return res.status(200).json(new ApiResponse(200, "Admin summary fetched successfully", {
    stats: {
      total_users: totalUsers,
      providers,
      tourists,
      total_experiences: totalExperiences,
      pending_experiences: pendingExperiences,
      approved_experiences: approvedExperiences,
      total_bookings: totalBookings,
      revenue_mtd: monthlyRevenue._sum.totalAmount || 0,
      currency: "NPR",
    },
    recent_activity: recentActivity,
  }));
});

const GetAdminUsers = asyncHandler(async (req, res) => {
  const { limit, offset } = clampPagination(req.query, 1);
  const search = String(req.query.search || "").trim();

  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { experiences: true, bookings: true, reviews: true } },
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { experience: { select: { id: true, title: true } } },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return res.status(200).json(new ApiResponse(200, "Admin users fetched successfully", {
    items: users.map(toUserResponse),
    pagination: {
      limit,
      offset,
      total,
      has_next: offset + users.length < total,
      next_offset: offset + users.length < total ? offset + limit : null,
      has_previous: offset > 0,
      previous_offset: Math.max(0, offset - limit),
    },
  }));
});

const GetAdminExperiences = asyncHandler(async (req, res) => {
  const { limit, offset } = clampPagination(req.query, 10);
  const search = String(req.query.search || "").trim();
  const rawStatus = String(req.query.status || "").trim().toUpperCase();

  const where = {};

  if (rawStatus && VALID_APPROVAL_STATUSES.has(rawStatus)) {
    where.approvalStatus = rawStatus;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { locationName: { contains: search, mode: "insensitive" } },
      { district: { contains: search, mode: "insensitive" } },
      { provider: { fullName: { contains: search, mode: "insensitive" } } },
      { provider: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [experiences, total] = await Promise.all([
    prisma.experience.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
      include: {
        provider: { select: { id: true, fullName: true, email: true } },
        _count: { select: { bookings: true, reviews: true } },
      },
    }),
    prisma.experience.count({ where }),
  ]);

  return res.status(200).json(new ApiResponse(200, "Admin experiences fetched successfully", {
    items: experiences.map(toExperienceResponse),
    pagination: {
      limit,
      offset,
      total,
      has_next: offset + experiences.length < total,
      next_offset: offset + experiences.length < total ? offset + limit : null,
      has_previous: offset > 0,
      previous_offset: Math.max(0, offset - limit),
    },
  }));
});

const UpdateExperienceApproval = asyncHandler(async (req, res) => {
  const experienceId = req.params.id;
  const approvalStatus = String(req.body?.approval_status || req.body?.approvalStatus || "").trim().toUpperCase();

  if (!UUID_PATTERN.test(experienceId)) {
    throw new ApiError(400, "Invalid experience id");
  }

  if (!VALID_APPROVAL_STATUSES.has(approvalStatus)) {
    throw new ApiError(400, "Approval status must be PENDING, APPROVED, or REJECTED");
  }

  const experience = await prisma.experience.update({
    where: { id: experienceId },
    data: {
      approvalStatus,
      isVerified: approvalStatus === "APPROVED",
    },
    include: {
      provider: { select: { id: true, fullName: true, email: true } },
      _count: { select: { bookings: true, reviews: true } },
    },
  });

  return res.status(200).json(new ApiResponse(200, "Experience approval updated successfully", toExperienceResponse(experience)));
});

const DeleteAdminExperience = asyncHandler(async (req, res) => {
  const experienceId = req.params.id;

  if (!UUID_PATTERN.test(experienceId)) {
    throw new ApiError(400, "Invalid experience id");
  }

  const existing = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: { id: true, title: true },
  });

  if (!existing) {
    throw new ApiError(404, "Experience not found");
  }

  await prisma.$transaction([
    prisma.impactCertificate.deleteMany({ where: { experienceId } }),
    prisma.booking.deleteMany({ where: { experienceId } }),
    prisma.review.deleteMany({ where: { experienceId } }),
    prisma.experience.delete({ where: { id: experienceId } }),
  ]);

  return res.status(200).json(new ApiResponse(200, "Experience deleted successfully", existing));
});

const GetAdminAnalytics = asyncHandler(async (req, res) => {
  const days = Math.max(7, Math.min(Number(req.query.days) || 14, 60));
  const buckets = buildDailyBuckets(days);
  const bucketMap = new Map(buckets.map((bucket) => [bucket.date, bucket]));
  const since = new Date(`${buckets[0].date}T00:00:00.000Z`);

  const [users, experiences, bookings, roleCounts, statusCounts, categoryCounts] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.experience.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.booking.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, totalAmount: true, status: true } }),
    prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    prisma.experience.groupBy({ by: ["approvalStatus"], _count: { id: true } }),
    prisma.experience.groupBy({ by: ["category"], _count: { id: true } }),
  ]);

  users.forEach((user) => {
    const bucket = bucketMap.get(formatDayKey(user.createdAt));
    if (bucket) bucket.users += 1;
  });

  experiences.forEach((experience) => {
    const bucket = bucketMap.get(formatDayKey(experience.createdAt));
    if (bucket) bucket.experiences += 1;
  });

  bookings.forEach((booking) => {
    const bucket = bucketMap.get(formatDayKey(booking.createdAt));
    if (!bucket) return;

    bucket.bookings += 1;
    if (["CONFIRMED", "COMPLETED"].includes(booking.status)) {
      bucket.revenue += booking.totalAmount;
    }
  });

  return res.status(200).json(new ApiResponse(200, "Admin analytics fetched successfully", {
    daily: buckets,
    users_by_role: roleCounts.map((item) => ({ role: item.role, count: item._count.id })),
    experiences_by_status: statusCounts.map((item) => ({ status: item.approvalStatus.toLowerCase(), count: item._count.id })),
    experiences_by_category: categoryCounts.map((item) => ({ category: item.category.toLowerCase(), count: item._count.id })),
  }));
});

export {
  DeleteAdminExperience,
  GetAdminAnalytics,
  GetAdminExperiences,
  GetAdminSummary,
  GetAdminUsers,
  UpdateExperienceApproval,
};
