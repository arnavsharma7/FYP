import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../utils/PrismaProvider.js";
import { buildCertificatePayload, calculateBookingImpact } from "../utils/impact.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_BOOKING_STATUSES = new Set(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);

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
  experience: booking.experience ? {
    id: booking.experience.id,
    title: booking.experience.title,
    location_name: booking.experience.locationName,
    thumbnail: booking.experience.thumbnail,
  } : undefined,
});

const toProviderBookingResponse = (booking) => ({
  id: booking.id,
  booking_date: booking.bookingDate,
  created_at: booking.createdAt,
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
  experience: booking.experience
    ? {
        id: booking.experience.id,
        title: booking.experience.title,
        location_name: booking.experience.locationName,
        thumbnail: booking.experience.thumbnail,
      }
    : null,
  traveler: booking.user
    ? {
        id: booking.user.id,
        full_name: booking.user.fullName,
        email: booking.user.email,
      }
    : null,
});

const clampPagination = (query, defaultLimit = 20) => {
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
      bookings: 0,
      revenue: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    };
  });
};

const bookingCertificateInclude = {
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
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
};

const requireProviderUser = async (req) => {
  const providerId = req.user?.id;

  if (!providerId) {
    throw new ApiError(401, "Unauthorized");
  }

  const provider = await prisma.user.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  });

  if (!provider || provider.role !== "provider") {
    throw new ApiError(403, "Only providers can access this resource");
  }

  return provider;
};

const CreateBooking = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.body?.user_id || req.body?.userId;
  const experienceId = req.body?.experience_id || req.body?.experienceId;
  const bookingDate = req.body?.booking_date || req.body?.bookingDate;
  const numGuests = Number(req.body?.num_guests || req.body?.numGuests || 1);

  if (!userId) {
    throw new ApiError(401, "Please sign in before booking this experience");
  }

  if (!UUID_PATTERN.test(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  if (!experienceId || !UUID_PATTERN.test(experienceId)) {
    throw new ApiError(400, "Invalid experience id");
  }

  if (!bookingDate) {
    throw new ApiError(400, "Booking date is required");
  }

  const parsedDate = new Date(bookingDate);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new ApiError(400, "Invalid booking date");
  }

  if (!Number.isInteger(numGuests) || numGuests < 1) {
    throw new ApiError(400, "Number of guests must be at least 1");
  }

  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
  });

  if (!experience) {
    throw new ApiError(404, "Experience not found");
  }

  if (numGuests > experience.maxGuests) {
    throw new ApiError(400, `This experience allows up to ${experience.maxGuests} guests`);
  }

  const impact = calculateBookingImpact({
    pricePerPerson: experience.pricePerPerson,
    numGuests,
  });

  const booking = await prisma.booking.create({
    data: {
      userId,
      experienceId,
      bookingDate: parsedDate,
      numGuests,
      totalAmount: impact.totalAmount,
      currency: experience.currency,
      baseAmount: impact.baseAmount,
      taxAmount: impact.taxAmount,
      localEarningsAmount: impact.localEarningsAmount,
      communityFundAmount: impact.communityFundAmount,
      platformFeeAmount: impact.platformFeeAmount,
      operationsAmount: impact.operationsAmount,
    },
    include: {
      experience: true,
    },
  });

  return res.status(201).json(new ApiResponse(
    201,
    "Booking request created successfully",
    toBookingResponse(booking)
  ));
});

const GetMyBookings = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, "Please sign in to view bookings");
  }

  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: { experience: true },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(
    200,
    "Bookings fetched successfully",
    bookings.map(toBookingResponse)
  ));
});

const CancelMyBooking = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const bookingId = req.params.id;

  if (!userId) {
    throw new ApiError(401, "Please sign in to cancel bookings");
  }

  if (!UUID_PATTERN.test(bookingId)) {
    throw new ApiError(400, "Invalid booking id");
  }

  const existing = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
    },
    include: { experience: true },
  });

  if (!existing) {
    throw new ApiError(404, "Booking not found");
  }

  if (existing.status === "CANCELLED") {
    throw new ApiError(400, "Booking is already cancelled");
  }

  if (!["PENDING", "CONFIRMED"].includes(existing.status)) {
    throw new ApiError(400, "Only pending or confirmed bookings can be cancelled");
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
    include: { experience: true },
  });

  return res.status(200).json(new ApiResponse(
    200,
    "Booking cancelled successfully",
    toBookingResponse(updated)
  ));
});

const GetProviderBookingsDashboard = asyncHandler(async (req, res) => {
  const provider = await requireProviderUser(req);
  const days = Math.max(7, Math.min(Number(req.query.days) || 14, 60));
  const { limit, offset } = clampPagination(req.query, 25);
  const statusFilter = req.query.status ? String(req.query.status).toUpperCase() : null;

  if (statusFilter && !VALID_BOOKING_STATUSES.has(statusFilter)) {
    throw new ApiError(400, "Invalid booking status filter");
  }

  const providerWhere = { experience: { providerId: provider.id } };
  const listWhere = statusFilter ? { ...providerWhere, status: statusFilter } : providerWhere;

  const buckets = buildDailyBuckets(days);
  const bucketMap = new Map(buckets.map((bucket) => [bucket.date, bucket]));
  const since = new Date(`${buckets[0].date}T00:00:00.000Z`);

  const [bookings, statusCounts, revenueSum, dailyBookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where: listWhere,
      include: {
        experience: {
          select: {
            id: true,
            title: true,
            locationName: true,
            thumbnail: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: providerWhere,
      _count: { id: true },
    }),
    prisma.booking.aggregate({
      where: {
        ...providerWhere,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.booking.findMany({
      where: {
        ...providerWhere,
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
      },
    }),
    prisma.booking.count({ where: listWhere }),
  ]);

  dailyBookings.forEach((booking) => {
    const bucket = bucketMap.get(formatDayKey(booking.createdAt));
    if (!bucket) return;

    bucket.bookings += 1;
    const statusKey = booking.status.toLowerCase();
    if (statusKey in bucket) {
      bucket[statusKey] += 1;
    }
    if (["CONFIRMED", "COMPLETED"].includes(booking.status)) {
      bucket.revenue += booking.totalAmount;
    }
  });

  const statusMap = new Map(statusCounts.map((item) => [item.status, item._count.id]));
  const totalBookings = statusCounts.reduce((sum, item) => sum + item._count.id, 0);

  return res.status(200).json(new ApiResponse(
    200,
    "Provider booking dashboard fetched successfully",
    {
      provider: {
        id: provider.id,
        full_name: provider.fullName,
        email: provider.email,
      },
      summary: {
        total_bookings: totalBookings,
        pending_bookings: statusMap.get("PENDING") || 0,
        confirmed_bookings: statusMap.get("CONFIRMED") || 0,
        cancelled_bookings: statusMap.get("CANCELLED") || 0,
        completed_bookings: statusMap.get("COMPLETED") || 0,
        revenue: revenueSum._sum.totalAmount || 0,
        currency: bookings[0]?.currency || "NPR",
      },
      bookings: bookings.map(toProviderBookingResponse),
      analytics: {
        daily: buckets,
      },
      pagination: {
        limit,
        offset,
        total: totalCount,
      },
    }
  ));
});

const UpdateProviderBookingStatus = asyncHandler(async (req, res) => {
  const provider = await requireProviderUser(req);
  const bookingId = req.params.id;

  if (!UUID_PATTERN.test(bookingId)) {
    throw new ApiError(400, "Invalid booking id");
  }

  const rawStatus = req.body?.status || req.body?.booking_status;
  if (!rawStatus) {
    throw new ApiError(400, "Booking status is required");
  }

  const normalizedStatus = String(rawStatus).toUpperCase() === "REJECTED"
    ? "CANCELLED"
    : String(rawStatus).toUpperCase();

  if (!["CONFIRMED", "CANCELLED", "COMPLETED"].includes(normalizedStatus)) {
    throw new ApiError(400, "Invalid booking status. Use CONFIRMED, CANCELLED, or COMPLETED.");
  }

  const existing = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      experience: { providerId: provider.id },
    },
    include: bookingCertificateInclude,
  });

  if (!existing) {
    throw new ApiError(404, "Booking not found");
  }

  if (normalizedStatus === "COMPLETED" && existing.status !== "CONFIRMED") {
    throw new ApiError(400, "Only confirmed bookings can be marked as completed");
  }

  if (["CONFIRMED", "CANCELLED"].includes(normalizedStatus) && existing.status !== "PENDING") {
    throw new ApiError(400, "Only pending bookings can be confirmed or cancelled");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: normalizedStatus },
      include: bookingCertificateInclude,
    });

    if (normalizedStatus === "COMPLETED") {
      const certificate = buildCertificatePayload(booking);

      await tx.impactCertificate.upsert({
        where: { bookingId: booking.id },
        update: {},
        create: {
          userId: booking.userId,
          bookingId: booking.id,
          experienceId: booking.experienceId,
          title: certificate.title,
          medalType: certificate.medalType,
          certificateCode: certificate.certificateCode,
          impactSummary: certificate.impactSummary,
        },
      });
    }

    return booking;
  });

  return res.status(200).json(new ApiResponse(
    200,
    normalizedStatus === "COMPLETED"
      ? "Booking completed and achievement medal issued"
      : "Booking status updated successfully",
    toProviderBookingResponse(updated)
  ));
});

export {
  CancelMyBooking,
  CreateBooking,
  GetMyBookings,
  GetProviderBookingsDashboard,
  UpdateProviderBookingStatus,
};
