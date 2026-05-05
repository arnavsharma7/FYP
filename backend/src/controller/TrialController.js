import jwt from "jsonwebtoken";
import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../utils/PrismaProvider.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const INTEREST_CATEGORY_MAP = {
  culture: ["HERITAGE_SITE", "WORKSHOP", "GUIDE"],
  trekking: ["TREKKING", "GUIDE", "HOMESTAY"],
  food: ["FOOD_TOUR", "WORKSHOP", "HOMESTAY"],
  spirituality: ["WELLNESS", "HERITAGE_SITE", "GUIDE"],
  adventure: ["ADVENTURE", "TREKKING", "GUIDE"],
};

const STYLE_CATEGORY_BONUS = {
  "cultural explorer": ["HERITAGE_SITE", "WORKSHOP", "GUIDE"],
  "active adventurer": ["TREKKING", "ADVENTURE", "GUIDE"],
  "spiritual seeker": ["WELLNESS", "HERITAGE_SITE", "GUIDE"],
  "food enthusiast": ["FOOD_TOUR", "WORKSHOP", "HOMESTAY"],
  "budget traveler": ["HOMESTAY", "HERITAGE_SITE", "FOOD_TOUR"],
  "luxury explorer": ["WELLNESS", "GUIDE", "WORKSHOP"],
};

const CATEGORY_INTEREST_MAP = {
  HOMESTAY: ["Culture", "Food", "Trekking"],
  WORKSHOP: ["Culture", "Food"],
  GUIDE: ["Culture", "Trekking", "Spirituality", "Adventure"],
  HERITAGE_SITE: ["Culture", "Spirituality"],
  FOOD_TOUR: ["Food", "Culture"],
  TREKKING: ["Trekking", "Adventure"],
  ADVENTURE: ["Adventure", "Trekking"],
  WELLNESS: ["Spirituality"],
};

const CATEGORY_LABELS = {
  HOMESTAY: "homestay",
  WORKSHOP: "workshop",
  GUIDE: "guide",
  HERITAGE_SITE: "heritage_site",
  FOOD_TOUR: "food_tour",
  TREKKING: "trekking",
  ADVENTURE: "adventure",
  WELLNESS: "wellness",
};

const normalizeInterest = (interest) => String(interest || "").trim();
const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const unique = (items) => [...new Set(items.filter(Boolean))];

const compactExperience = (experience) => ({
  id: experience.id,
  title: experience.title,
  category: CATEGORY_LABELS[experience.category] || experience.category.toLowerCase(),
  avg_rating: experience.avgRating,
  price_per_person: experience.pricePerPerson,
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

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== "string") return null;

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return null;

  return token;
};

const getOptionalUser = (req) => {
  const token = extractBearerToken(req.get("authorization"));
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "tourist",
    };
  } catch {
    return null;
  }
};

const getRequestedCategories = (interests, travelStyle) => {
  const interestCategories = interests.flatMap(
    (interest) => INTEREST_CATEGORY_MAP[normalizeKey(interest)] || []
  );
  const styleCategories = STYLE_CATEGORY_BONUS[normalizeKey(travelStyle)] || [];

  return unique([...interestCategories, ...styleCategories]);
};

const getExperienceInterestMatches = (experience, requestedInterests) => {
  const experienceInterests = CATEGORY_INTEREST_MAP[experience.category] || [];
  const requestedKeys = requestedInterests.map(normalizeKey);

  return experienceInterests.filter((interest) => requestedKeys.includes(normalizeKey(interest)));
};

const scoreExperience = ({ experience, requestedInterests, requestedCategories, travelStyle, dailyBudget }) => {
  const interestMatches = getExperienceInterestMatches(experience, requestedInterests).length;
  const styleCategories = STYLE_CATEGORY_BONUS[normalizeKey(travelStyle)] || [];
  const categoryMatch = requestedCategories.includes(experience.category) ? 1 : 0;
  const styleMatch = styleCategories.includes(experience.category) ? 1 : 0;
  const ratingScore = Number(experience.avgRating || 0) * 8;
  const impactScore = Number(experience.communityImpactScore || 0) * 3;
  const popularityScore = Math.min(Number(experience.totalBookings || 0) / 25, 12);
  const priceRatio = dailyBudget > 0 ? experience.pricePerPerson / dailyBudget : 1;
  const budgetScore = priceRatio <= 1 ? 20 : Math.max(0, 16 - (priceRatio - 1) * 18);
  const verifiedScore = experience.isVerified ? 8 : 0;

  return (
    interestMatches * 28 +
    categoryMatch * 24 +
    styleMatch * 18 +
    ratingScore +
    impactScore +
    popularityScore +
    budgetScore +
    verifiedScore
  );
};

const selectTemplateTrail = (trails, interests, duration, budget, travelStyle) => {
  if (!trails.length) return null;

  const requestedInterestKeys = interests.map(normalizeKey);
  const styleKey = normalizeKey(travelStyle);

  return trails
    .map((trail) => {
      const interestMatches = (trail.interests || []).filter((interest) =>
        requestedInterestKeys.includes(normalizeKey(interest))
      ).length;
      const durationDistance = Math.abs(trail.durationDays - duration);
      const budgetDistance = Math.abs((trail.totalCostEstimate || budget) - budget) / Math.max(budget, 1);
      const styleMatch = normalizeKey(trail.travelStyle) === styleKey ? 1 : 0;

      return {
        trail,
        score:
          interestMatches * 35 +
          styleMatch * 25 +
          Math.max(0, 20 - durationDistance * 4) +
          Math.max(0, 20 - budgetDistance * 20) +
          (trail.isFeatured ? 5 : 0),
      };
    })
    .sort((a, b) => b.score - a.score)[0]?.trail || null;
};

const estimateDayCost = (experience, dailyBudget) => {
  if (!experience) return Math.round(dailyBudget * 0.7);

  const logisticsAllowance = experience.durationHours >= 24 ? 1500 : 800;
  return Math.max(experience.pricePerPerson, experience.pricePerPerson + logisticsAllowance);
};

const dayTitle = (dayNumber, experience, interests) => {
  if (experience) return `${experience.locationName}: ${experience.title}`;

  const fallbackInterest = interests[(dayNumber - 1) % Math.max(interests.length, 1)] || "Heritage";
  return `${fallbackInterest} Discovery Day`;
};

const dayDescription = (experience, templateDay, interests) => {
  if (experience) {
    return experience.shortDescription || experience.description;
  }

  if (templateDay?.description) return templateDay.description;

  return `A flexible day reserved for local discovery, rest, transit, and smaller ${interests.join(", ") || "heritage"} experiences.`;
};

const shouldInsertFlexibleDay = ({ dayIndex, duration, availableExperienceCount, selectedCount }) => {
  const remainingDays = duration - dayIndex;
  const remainingExperiences = Math.max(availableExperienceCount - selectedCount, 0);

  if (remainingExperiences === 0) return true;

  // If the trip is longer than the experience pool, spread buffer days through the
  // itinerary instead of dumping them all at the end.
  if (remainingDays > remainingExperiences) {
    if (dayIndex > 0 && dayIndex % 3 === 2) return true;
    return remainingDays - remainingExperiences > Math.ceil(remainingExperiences / 2);
  }

  // Even when there are enough listings, avoid a dense nonstop itinerary.
  return duration >= 7 && dayIndex > 0 && dayIndex % 4 === 3;
};

const buildDays = ({ experiences, templateTrail, interests, duration, budget, travelStyle }) => {
  const dailyBudget = Math.max(Math.floor(budget / duration), 1);
  const selectedIds = new Set();
  const templateDays = Array.isArray(templateTrail?.days) ? templateTrail.days : [];
  const days = [];

  for (let index = 0; index < duration; index += 1) {
    const templateDay = templateDays[index] || null;
    const preferredLocation = normalizeKey(templateDay?.location || "");
    const previousDistrict = days[index - 1]?.district || null;
    const useFlexibleDay = shouldInsertFlexibleDay({
      dayIndex: index,
      duration,
      availableExperienceCount: experiences.length,
      selectedCount: selectedIds.size,
    });

    const rankedCandidates = useFlexibleDay
      ? []
      : experiences
        .filter((experience) => !selectedIds.has(experience.id))
        .map((experience) => {
          const sameTemplateLocation = preferredLocation && normalizeKey(experience.district).includes(preferredLocation)
            ? 14
            : 0;
          const samePreviousDistrict = previousDistrict && experience.district === previousDistrict ? 8 : 0;
          const templateCategoryBonus = templateDay?.title && normalizeKey(templateDay.title).includes(normalizeKey(experience.district))
            ? 8
            : 0;

          return {
            experience,
            score: experience.recommendationScore + sameTemplateLocation + samePreviousDistrict + templateCategoryBonus,
          };
        })
        .sort((a, b) => b.score - a.score);

    const best = rankedCandidates[0]?.experience || null;
    if (best) selectedIds.add(best.id);

    const estimatedCost = estimateDayCost(best, dailyBudget);

    days.push({
      day_number: index + 1,
      title: dayTitle(index + 1, best, interests),
      description: dayDescription(best, best ? templateDay : null, interests),
      location: best?.locationName || days[index - 1]?.location || templateDay?.location || "Nepal",
      district: best?.district || null,
      estimated_cost: estimatedCost,
      experience_id: best?.id || null,
      experience: best ? compactExperience(best) : null,
      planning_reason: best
        ? `Matched ${best.category.toLowerCase().replace("_", " ")} with ${travelStyle || "your"} travel style and selected interests.`
        : "Flexible buffer day placed between provider experiences for rest, transit, local wandering, and smaller optional activities.",
    });
  }

  const rawTotal = days.reduce((sum, day) => sum + Number(day.estimated_cost || 0), 0);

  if (rawTotal > budget && rawTotal > 0) {
    const scale = budget / rawTotal;
    days.forEach((day) => {
      day.estimated_cost = Math.max(500, Math.round(day.estimated_cost * scale));
    });
  }

  return days.map(({ district, ...day }) => day);
};

const inferDifficulty = (interests, days) => {
  const hasHardInterest = interests.some((interest) => ["trekking", "adventure"].includes(normalizeKey(interest)));
  const hasLongExperience = days.some((day) => Number(day.experience?.price_per_person || 0) >= 50000);

  if (hasHardInterest && days.length >= 7) return "HARD";
  if (hasHardInterest || hasLongExperience) return "MODERATE";
  return "EASY";
};

const buildTrailTitle = (interests, duration, travelStyle, templateTrail) => {
  if (templateTrail?.isFeatured) {
    return `${duration}-Day Custom ${templateTrail.title}`;
  }

  const focus = interests.slice(0, 2).join(" & ") || "Heritage";
  return `${duration}-Day ${focus} Nepal Trail`;
};

const hydrateTrailDays = async (trail) => {
  const days = Array.isArray(trail.days) ? trail.days : [];
  const experienceIds = unique(
    days.map((day) => day.experience_id || day.experienceId || day.experience?.id)
  ).filter((id) => UUID_PATTERN.test(String(id)));

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

const GenerateTrail = asyncHandler(async (req, res) => {
  const requestedInterests = Array.isArray(req.body?.interests)
    ? unique(req.body.interests.map(normalizeInterest))
    : [];
  const duration = Number(req.body?.duration || req.body?.duration_days);
  const budget = Number(req.body?.budget || req.body?.total_cost_estimate);
  const travelStyle = String(req.body?.travel_style || req.body?.travelStyle || "").trim();

  if (!requestedInterests.length) {
    throw new ApiError(400, "Select at least one interest before generating a trail");
  }

  if (!Number.isInteger(duration) || duration < 1 || duration > 15) {
    throw new ApiError(400, "Duration must be between 1 and 15 days");
  }

  if (!Number.isFinite(budget) || budget < 1000) {
    throw new ApiError(400, "Budget must be at least NPR 1,000");
  }

  if (!travelStyle) {
    throw new ApiError(400, "Travel style is required");
  }

  const user = getOptionalUser(req);
  const requestedCategories = getRequestedCategories(requestedInterests, travelStyle);
  const dailyBudget = Math.max(Math.floor(budget / duration), 1);

  const [matchingExperiences, fallbackExperiences, templateTrails] = await Promise.all([
    prisma.experience.findMany({
      where: {
        approvalStatus: "APPROVED",
        category: requestedCategories.length ? { in: requestedCategories } : undefined,
      },
      orderBy: [{ avgRating: "desc" }, { totalBookings: "desc" }, { pricePerPerson: "asc" }],
      take: 80,
    }),
    prisma.experience.findMany({
      where: { approvalStatus: "APPROVED" },
      orderBy: [{ avgRating: "desc" }, { totalBookings: "desc" }, { pricePerPerson: "asc" }],
      take: 40,
    }),
    prisma.trail.findMany({
      where: {
        isFeatured: true,
        OR: [
          { interests: { hasSome: requestedInterests } },
          { travelStyle },
        ],
      },
      orderBy: [{ isFeatured: "desc" }, { avgRating: "desc" }, { totalBookings: "desc" }],
      take: 25,
    }),
  ]);

  const experiencePool = unique([...matchingExperiences, ...fallbackExperiences].map((experience) => experience.id))
    .map((id) => [...matchingExperiences, ...fallbackExperiences].find((experience) => experience.id === id));

  if (!experiencePool.length) {
    throw new ApiError(404, "No approved provider experiences are available yet");
  }

  const scoredExperiences = experiencePool
    .map((experience) => ({
      ...experience,
      recommendationScore: scoreExperience({
        experience,
        requestedInterests,
        requestedCategories,
        travelStyle,
        dailyBudget,
      }),
    }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  const templateTrail = selectTemplateTrail(templateTrails, requestedInterests, duration, budget, travelStyle);
  const days = buildDays({
    experiences: scoredExperiences,
    templateTrail,
    interests: requestedInterests,
    duration,
    budget,
    travelStyle,
  });
  const totalCostEstimate = days.reduce((sum, day) => sum + Number(day.estimated_cost || 0), 0);
  const difficulty = inferDifficulty(requestedInterests, days);

  const trail = await prisma.trail.create({
    data: {
      creatorId: user?.id || null,
      title: buildTrailTitle(requestedInterests, duration, travelStyle, templateTrail),
      description: `A ${duration}-day ${travelStyle} route built from approved provider experiences for ${requestedInterests.join(", ")}.`,
      difficulty,
      durationDays: duration,
      totalCostEstimate,
      currency: "NPR",
      interests: requestedInterests,
      travelStyle,
      isFeatured: false,
      days,
    },
  });

  return res.status(201).json(new ApiResponse(201, "Trail generated and saved successfully", {
    trail: toTrailResponse(trail),
    template_trail_id: templateTrail?.id || null,
  }));
});

const GetTrails = asyncHandler(async (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 24, 100));

  const trails = await prisma.trail.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return res.status(200).json(new ApiResponse(200, "Trails fetched successfully", trails.map(toTrailResponse)));
});

const GetFeaturedTrails = asyncHandler(async (_req, res) => {
  const trails = await prisma.trail.findMany({
    where: { isFeatured: true },
    orderBy: [{ avgRating: "desc" }, { totalBookings: "desc" }],
  });

  return res.status(200).json(new ApiResponse(200, "Featured trails fetched successfully", trails.map(toTrailResponse)));
});

const GetMyTrails = asyncHandler(async (req, res) => {
  const user = getOptionalUser(req);

  if (!user?.id) {
    throw new ApiError(401, "Please sign in to view saved trails");
  }

  const trails = await prisma.trail.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, "Saved trails fetched successfully", trails.map(toTrailResponse)));
});

const GetTrailById = asyncHandler(async (req, res) => {
  const trail = await prisma.trail.findUnique({
    where: { id: req.params.id },
  });

  if (!trail) {
    throw new ApiError(404, "Trail not found");
  }

  const hydratedTrail = await hydrateTrailDays(trail);

  return res.status(200).json(new ApiResponse(200, "Trail fetched successfully", toTrailResponse(hydratedTrail)));
});

export {
  GenerateTrail,
  GetFeaturedTrails,
  GetMyTrails,
  GetTrailById,
  GetTrails,
};
