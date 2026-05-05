import asyncHandler from "../utils/AsyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../utils/PrismaProvider.js";
import { buildImpactSummary } from "../utils/impact.js";

const getCompletedBookings = () =>
  prisma.booking.findMany({
    where: { status: "COMPLETED" },
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
  });

const GetImpactStats = asyncHandler(async (_req, res) => {
  const bookings = await getCompletedBookings();
  const summary = buildImpactSummary(bookings);

  return res.status(200).json(new ApiResponse(200, "Impact stats fetched successfully", summary));
});

const GetImpactDistribution = asyncHandler(async (_req, res) => {
  const bookings = await getCompletedBookings();
  const summary = buildImpactSummary(bookings);

  return res.status(200).json(new ApiResponse(200, "Impact distribution fetched successfully", {
    distribution: summary.distribution,
    regional: summary.regional,
  }));
});

export {
  GetImpactDistribution,
  GetImpactStats,
};
