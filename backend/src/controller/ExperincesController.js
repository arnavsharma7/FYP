import bcrypt from "bcryptjs";
import asyncHandler from "../utils/AsyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../utils/PrismaProvider.js";
import ApiError from "../utils/ApiError.js";

const sanitizeEnvValue = (value) => {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/;+\s*$/, "")
    .trim();
};

const DEFAULT_PROVIDER_ID = sanitizeEnvValue(process.env.DEFAULT_PROVIDER_ID);
const DEFAULT_PROVIDER_EMAIL = sanitizeEnvValue(process.env.DEFAULT_PROVIDER_EMAIL).toLowerCase();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const createProviderExperience = asyncHandler(async (req, res) => {
  const providerId = req.user?.id;

  if (!providerId) {
    throw new ApiError(401, "Unauthorized");
  }

  const provider = await prisma.user.findUnique({
    where: { id: providerId },
  });

  if (!provider || provider.role !== "provider") {
    throw new ApiError(403, "Only providers can create experiences");
  }

  const {
    title,
    description,
    shortDescription,
    category,
    pricePerPerson,
    currency,
    durationHours,
    maxGuests,
    locationName,
    latitude,
    longitude,
    district,
    province,
    thumbnailUrl,
    images,
    panoramaImages,
    streetViewUrl,
    amenities,
    languages,
  } = req.body;

  let thumbnail = null;

  if (req.file) {
    thumbnail = req.file.path;
  } else if (thumbnailUrl) {
    thumbnail = thumbnailUrl;
  } if (!title || !description || !shortDescription || !category) {
    throw new ApiError(400, "Required experience fields are missing");
  }

  const experience = await prisma.experience.create({
    data: {
      providerId,

      title,
      description,
      shortDescription,

      category: category.toUpperCase(),
      pricePerPerson: Number(pricePerPerson),
      currency: currency || "NPR",
      durationHours: Number(durationHours),
      maxGuests: Number(maxGuests),

      locationName,
      latitude: Number(latitude),
      longitude: Number(longitude),
      district,
      province,

      thumbnail,
      images: parseArray(images),
      panoramaImages: parseArray(panoramaImages).map(normalizePanoramaUrl),
      streetViewUrl: streetViewUrl || null,

      amenities: parseArray(amenities),
      languages: parseArray(languages),

      isVerified: false,
      approvalStatus: "PENDING",

      avgRating: 0,
      totalReviews: 0,
      totalBookings: 0,
      communityImpactScore: 0,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, "Experience submitted for admin approval", {
      experience: {
        id: experience.id,
        title: experience.title,
        category: experience.category.toLowerCase(),
        approvalStatus: experience.approvalStatus,
        isVerified: experience.isVerified,
        thumbnail: experience.thumbnail,
      },
    })
  );
});

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

const toProviderReviewResponse = (review) => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  created_at: review.createdAt,
  experience: review.experience
    ? {
      id: review.experience.id,
      title: review.experience.title,
      approval_status: review.experience.approvalStatus,
    }
    : null,
  reviewer: review.user
    ? {
      id: review.user.id,
      full_name: review.user.fullName,
    }
    : null,
});

const GetProviderLatestReviews = asyncHandler(async (req, res) => {
  const provider = await requireProviderUser(req);
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 5, 20));

  const reviews = await prisma.review.findMany({
    where: {
      experience: {
        providerId: provider.id,
      },
    },
    include: {
      experience: {
        select: {
          id: true,
          title: true,
          approvalStatus: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Provider latest reviews fetched successfully",
        reviews.map(toProviderReviewResponse)
      )
    );
});

const GetProviderDashboard = asyncHandler(async (req, res) => {
  const provider = await requireProviderUser(req);

  const [experiences, bookingSums, latestReviews] = await Promise.all([
    prisma.experience.findMany({
      where: { providerId: provider.id },
      include: {
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.groupBy({
      by: ["experienceId"],
      where: {
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
        experience: {
          providerId: provider.id,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.review.findMany({
      where: {
        experience: {
          providerId: provider.id,
        },
      },
      include: {
        experience: {
          select: {
            id: true,
            title: true,
            approvalStatus: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const bookingMap = new Map(
    bookingSums.map((item) => [
      item.experienceId,
      {
        revenue: item._sum.totalAmount || 0,
        confirmedBookings: item._count.id || 0,
      },
    ])
  );

  const listings = experiences.map((experience) => {
    const bookingStats = bookingMap.get(experience.id);
    const revenue = bookingStats?.revenue || 0;
    const confirmedBookings = bookingStats?.confirmedBookings || 0;

    return {
      id: experience.id,
      title: experience.title,
      category: experience.category.toLowerCase(),
      district: experience.district,
      province: experience.province,
      thumbnail: experience.thumbnail,
      approval_status: experience.approvalStatus,
      is_verified: experience.isVerified,
      avg_rating: experience.avgRating,
      total_reviews: experience.totalReviews,
      total_bookings: experience.totalBookings || experience._count.bookings,
      confirmed_bookings: confirmedBookings,
      total_revenue: revenue,
      price_per_person: experience.pricePerPerson,
      currency: experience.currency,
      created_at: experience.createdAt,
      updated_at: experience.updatedAt,
    };
  });

  const totalRevenue = listings.reduce((sum, listing) => sum + listing.total_revenue, 0);
  const totalBookings = listings.reduce((sum, listing) => sum + listing.total_bookings, 0);
  const confirmedBookings = listings.reduce(
    (sum, listing) => sum + listing.confirmed_bookings,
    0
  );

  const totalReviews = listings.reduce((sum, listing) => sum + listing.total_reviews, 0);
  const weightedRatingSum = listings.reduce(
    (sum, listing) => sum + listing.avg_rating * listing.total_reviews,
    0
  );
  const averageRating = totalReviews > 0 ? Number((weightedRatingSum / totalReviews).toFixed(2)) : 0;

  const summary = {
    total_listings: listings.length,
    active_listings: listings.filter((listing) => listing.approval_status === "APPROVED").length,
    pending_listings: listings.filter((listing) => listing.approval_status === "PENDING").length,
    rejected_listings: listings.filter((listing) => listing.approval_status === "REJECTED").length,
    total_bookings: totalBookings,
    confirmed_bookings: confirmedBookings,
    total_reviews: totalReviews,
    avg_rating: averageRating,
    total_revenue: totalRevenue,
    currency: listings[0]?.currency || "NPR",
  };

  return res.status(200).json(
    new ApiResponse(200, "Provider dashboard fetched successfully", {
      provider: {
        id: provider.id,
        full_name: provider.fullName,
        email: provider.email,
      },
      summary,
      listings,
      latest_reviews: latestReviews.map(toProviderReviewResponse),
    })
  );
});


const normalizePanoramaUrl = (value) => {
  if (!value) return value;

  const iframeSrcMatch = String(value).match(/src=["']([^"']+)["']/i);
  const rawUrl = iframeSrcMatch?.[1] || String(value).trim();

  try {
    const url = new URL(rawUrl);

    if (url.hostname.includes("360cities.net")) {
      const segments = url.pathname.split("/").filter(Boolean);
      const embedIndex = segments.indexOf("embed_iframe");

      if (embedIndex >= 0 && segments[embedIndex + 1]) {
        return `https://www.360cities.net/embed_iframe/${segments[embedIndex + 1]}`;
      }

      const imageIndex = segments.lastIndexOf("image");
      if (imageIndex >= 0 && segments[imageIndex + 1]) {
        return `https://www.360cities.net/embed_iframe/${segments[imageIndex + 1]}`;
      }
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
};

const toExperienceResponse = (experience) => ({
  id: experience.id,
  provider_id: experience.providerId,
  title: experience.title,
  slug: experience.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
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
  panorama_images: experience.panoramaImages.map(normalizePanoramaUrl),
  street_view_url: experience.streetViewUrl,
  amenities: experience.amenities,
  languages: experience.languages,
  is_verified: experience.isVerified,
  avg_rating: experience.avgRating,
  total_reviews: experience.totalReviews,
  total_bookings: experience.totalBookings,
  community_impact_score: experience.communityImpactScore,
  approval_status: experience.approvalStatus,
  created_at: experience.createdAt,
  updated_at: experience.updatedAt,
  reviews: experience.reviews?.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: `${review.rating}/5 rating`,
    comment: review.comment,
    created_at: review.createdAt,
  })) || [],
});

const InitExperiences = asyncHandler(async (req, res) => {
  if (!DEFAULT_PROVIDER_ID || !DEFAULT_PROVIDER_EMAIL) {
    throw new ApiError(
      500,
      "DEFAULT_PROVIDER_ID and DEFAULT_PROVIDER_EMAIL must be set in environment."
    );
  }

  if (!UUID_PATTERN.test(DEFAULT_PROVIDER_ID)) {
    throw new ApiError(
      500,
      "DEFAULT_PROVIDER_ID must be a valid UUID (without quotes or semicolon)."
    );
  }

  const experiences = [
    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Ghandruk Gurung Homestay Experience",
      description:
        "Immerse yourself in traditional Gurung culture in the picturesque village of Ghandruk. Wake up to panoramic views of Annapurna South and Machhapuchhre (Fishtail). Stay with a local Gurung family, enjoy authentic dal-bhat cooked on a wood fire, learn traditional songs and dances, and trek through rhododendron forests. This is not just accommodation — it is a doorway into centuries-old mountain culture.",
      shortDescription:
        "Stay with a Gurung family in Ghandruk with panoramic Annapurna views and authentic cultural immersion.",
      category: "HOMESTAY",
      pricePerPerson: 3500,
      currency: "NPR",
      durationHours: 48,
      maxGuests: 6,
      locationName: "Ghandruk, Kaski District",
      latitude: 28.3716,
      longitude: 83.8017,
      district: "Kaski",
      province: "Gandaki",

      // Real Wikimedia Commons image of Ghandruk village with Annapurna backdrop
      thumbnail:
        "https://imgs.search.brave.com/4B4IP0n-Xs_n7SkLvmgPl2Aqnr1Z8WiLvoh9Y5UCxI8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9leHBs/b3JlYWxsYWJvdXRu/ZXBhbC5jb20vd3At/Y29udGVudC91cGxv/YWRzLzIwMjUvMTIv/aW1hZ2UtMS0xOTIw/eDE0NDAuanBn",

      images: [
        // Ghandruk village panoramic view
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ghandruk_village%2C_Nepal.jpg/1280px-Ghandruk_village%2C_Nepal.jpg",
        // Annapurna South + Machhapuchhre from the area
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Annapurna_South%2C_Himchuli%2C_Machapuchare_Himal-3794.jpg/1280px-Annapurna_South%2C_Himchuli%2C_Machapuchare_Himal-3794.jpg",
        // Gurung village terraces Annapurna region
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Annapurna_Massif_Panorama.jpg/1280px-Annapurna_Massif_Panorama.jpg",
      ],

      // 360° panorama embed from 360cities — Ghandruk sunrise with Annapurna
      panoramaImages: [
        "https://www.360cities.net/embed_iframe/ghandruk-sunrise-annapurna",
        "https://www.360cities.net/embed_iframe/trek-from-birethani-to-ghandruk",
      ],

      // Google Maps Street View — Ghandruk village area (Annapurna foothills)
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFGMVFpcE15eHV5N3VFSmtBek1FZlNtdF9sTVZYUzNHakRSMWpOVHJMMEh3!2m2!1d28.3716!2d83.8017!3f0!4f0!5f0.7820865974627469",

      amenities: [
        "Traditional meals",
        "Mountain views",
        "Cultural program",
        "Guided village walk",
        "Hot shower",
      ],
      languages: ["Nepali", "English", "Gurung"],
      isVerified: true,
      avgRating: 4.8,
      totalReviews: 124,
      totalBookings: 340,
      communityImpactScore: 9.2,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-07-01T06:00:00Z"),
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. BHAKTAPUR THANGKA PAINTING WORKSHOP
    // ─────────────────────────────────────────────────────────────────────────────
    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Bhaktapur Thangka Painting Workshop",
      description:
        "Learn the sacred art of Thangka painting from master artist Sita Thapa in her ancestral workshop in Bhaktapur Durbar Square. Discover the spiritual symbolism behind each brushstroke, prepare natural mineral pigments, and create your own miniature Thangka to take home. Includes a guided tour of Bhaktapur's ancient art galleries and a traditional Newari lunch.",
      shortDescription:
        "Master the ancient art of Thangka painting with a master artist in Bhaktapur Durbar Square.",
      category: "WORKSHOP",
      pricePerPerson: 5500,
      currency: "NPR",
      durationHours: 8,
      maxGuests: 8,
      locationName: "Bhaktapur Durbar Square",
      latitude: 27.6722,
      longitude: 85.4298,
      district: "Bhaktapur",
      province: "Bagmati",

      // Bhaktapur Durbar Square golden light — Wikimedia Commons
      thumbnail:
        "https://imgs.search.brave.com/E13KxHSrMS5xmOchUyjK9yl5nD3TzQyCS5ETqc4ujGQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/Z2V0eW91cmd1aWRl/LmNvbS9pbWFnZS9m/b3JtYXQ9YXV0byxm/aXQ9Y3JvcCxncmF2/aXR5PWF1dG8scXVh/bGl0eT02MCx3aWR0/aD02MjAsaGVpZ2h0/PTQwMCxkcHI9MS90/b3VyX2ltZy8wOWYx/Y2RmNDdiMGM2MWRk/YzY2YjljNWE3ZTQy/ZDk0YjNlNWJlOTIw/YTkxNTk1ZTNhNTFj/MmU5NzEzMDQwNTY2/LmpwZw",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Durbar_Square_of_Bhaktapur.jpg/1280px-Durbar_Square_of_Bhaktapur.jpg",
        // Clay Pots / Potter's Square Bhaktapur (thematically linked craft)
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Clay_Pots-BW-IMG_7303.jpg/1280px-Clay_Pots-BW-IMG_7303.jpg",
        // Bhaktapur Nyatapola temple
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Nyatapola_Temple%2C_Bhaktapur.jpg/1024px-Nyatapola_Temple%2C_Bhaktapur.jpg",
      ],

      // 360° panorama — Bhaktapur Durbar Square
      panoramaImages: [
        "https://www.360cities.net/image/baktapur-nyatapola-temple-at-taumadhi-square-kathmandu#-24.06,0.34,70.0",
        "https://www.360cities.net/embed_iframe/bhaktapur-durbar-square",
        "https://www.360cities.net/image/bhaktapur-kathmandu-nepal#93.54,10.47,70.0",
      ],

      // Google Maps Street View — Bhaktapur Durbar Square (now fully mapped)
      // Bolache Tole / Potter's Square is confirmed in Street View per Google's launch blog
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFGMVFpcE5BajBUeUQ3LVJlWk5wQ0I2bS1rZ0NiUlZzZmVzSWpPVlFRaEZp!2m2!1d27.6722!2d85.4298!3f180!4f0!5f0.7820865974627469",

      amenities: [
        "Art materials provided",
        "Newari lunch",
        "Gallery tour",
        "Take-home artwork",
        "Certificate",
      ],
      languages: ["Nepali", "English", "Newari"],
      isVerified: true,
      avgRating: 4.9,
      totalReviews: 87,
      totalBookings: 210,
      communityImpactScore: 8.8,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-08-25T06:00:00Z"),
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. EVEREST BASE CAMP TREK WITH SHERPA GUIDE
    // ─────────────────────────────────────────────────────────────────────────────
    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Everest Base Camp Trek with Sherpa Guide",
      description:
        "Trek to the foot of the world's highest peak with Dorje Sherpa, a three-time Everest summiter. This 14-day guided experience takes you through Sherpa villages, ancient monasteries, and breathtaking Himalayan landscapes. Learn about Sherpa culture, Buddhist traditions, and mountaineering history from someone who lives it every day.",
      shortDescription:
        "Trek to Everest Base Camp with a 3x Everest summiter and Sherpa cultural guide.",
      category: "GUIDE",
      pricePerPerson: 85000,
      currency: "NPR",
      durationHours: 336,
      maxGuests: 12,
      locationName: "Namche Bazaar to Everest Base Camp",
      latitude: 27.9881,
      longitude: 86.925,
      district: "Solukhumbu",
      province: "Province 1",

      // Everest, Nuptse, Khumbu Glacier — Wikimedia Commons featured picture
      thumbnail:
        "https://imgs.search.brave.com/YDlmEyEH8-D69v3QepzBkwfKjsj56jjQ_Y90LxXcNn0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9yZXMu/Y2xvdWRpbmFyeS5j/b20vZW5jaGFudGlu/Zy9xXzcwLGZfYXV0/byx3Xzk2NSxoXzQw/MCxjX2xmaWxsLGdf/YXV0by9leG9kdXMt/d2ViLzIwMjUvMDMv/VE5UX0V2ZXJlc3Qt/QmFzZS1DYW1wX0Nv/bnRlbnQtQ3JlYXRv/ci1FdWFuLVdoaXRi/b3VybmUxNC5qcGVn",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg/1280px-Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg",
        // EBC trail — Everest, Lhotse, Ama Dablam view
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Everest%2C_Himalayas.jpg/1280px-Everest%2C_Himalayas.jpg",
        // Khumbu glacier / EBC panorama
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Everest%2C_Nuptse%2C_Khumbu_Glacier%2C_Nepal%2C_Himalayas.jpg/1280px-Everest%2C_Nuptse%2C_Khumbu_Glacier%2C_Nepal%2C_Himalayas.jpg",
      ],

      // 360° panoramas — Everest / Khumbu region
      panoramaImages: [
        "https://www.360cities.net/embed_iframe/everest-base-camp-nepal",
        "https://www.360cities.net/image/everest-base-camp-5364m#230.88,13.95,45.0",
      ],

      // Google Maps Street View — Namche Bazaar area (EBC trekking route)
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFGMVFpcE5CSzRZbWtMV1dJeWZvUWNzMG1yX3NWaklKMzg0NlhVUHRFWkl6!2m2!1d27.8069!2d86.7144!3f0!4f0!5f0.7820865974627469",

      amenities: [
        "Experienced guide",
        "Porter support",
        "Teahouse accommodation",
        "Meals included",
        "Permit assistance",
      ],
      languages: ["Nepali", "English", "Sherpa"],
      isVerified: true,
      avgRating: 5.0,
      totalReviews: 56,
      totalBookings: 120,
      communityImpactScore: 9.5,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-04-01T05:00:00Z"),
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. PATAN DURBAR SQUARE HERITAGE WALK
    // ─────────────────────────────────────────────────────────────────────────────
    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Patan Durbar Square Heritage Walk",
      description:
        "Explore the UNESCO World Heritage Site of Patan Durbar Square with an expert heritage guide. Discover ancient temples, intricate Newari wood carvings, the famous Krishna Mandir, and the Patan Museum. Visit working artisan workshops where traditional metalwork, woodcarving, and pottery techniques have been passed down for generations.",
      shortDescription:
        "Guided heritage walk through Patan's UNESCO temples, artisan workshops, and ancient squares.",
      category: "HERITAGE_SITE",
      pricePerPerson: 2500,
      currency: "NPR",
      durationHours: 4,
      maxGuests: 15,
      locationName: "Patan Durbar Square, Lalitpur",
      latitude: 27.6727,
      longitude: 85.3252,
      district: "Lalitpur",
      province: "Bagmati",

      // Patan Durbar Square — Wikimedia Commons
      thumbnail:
        "https://imgs.search.brave.com/vwFBJPEyvnCm3cKuK-625F1IbVXp8PYXadIsECkc-0g/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jbXMu/aG9saWRheXN0b25l/cGFsLmluL21lZGlh/L0Jsb2dzL1BhdGFu/LUR1cmJhci1TcXVh/cmUvcGF0YW4tZHVy/YmFyLXNxdWFyZS1h/cmNoaXRlY3R1cmUu/cG5n",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patan_durbar_square.jpg/1280px-Patan_durbar_square.jpg",
        // Golden Temple Patan interior
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Golden_temple_patan_durbar_square.jpg/976px-Golden_temple_patan_durbar_square.jpg",
        // Patan Krishna Mandir
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Patan-Durbar-Square.jpg/1280px-Patan-Durbar-Square.jpg",
      ],

      // 360° panorama — Patan Durbar Square
      panoramaImages: [
        "https://www.360cities.net/image/nepal-2017-kathmandu-durbar-square-stone-pillar-pratap-dhwaja",
        "https://www.360cities.net/image/patan-durbar-square-katmandu-lalitpur--nepal#-159.54,3.85,70.0",
      ],

      // Google Maps Street View — Patan Durbar Square (fully mapped by Google)
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFGMVFpcE16NzROeVhxbXBSaW11bjVORjljSjlHbERjdVFSeVJkSmVrRVc4!2m2!1d27.6727!2d85.3252!3f270!4f0!5f0.7820865974627469",

      amenities: [
        "Expert guide",
        "Museum entry",
        "Artisan workshop visit",
        "Cultural briefing",
        "Refreshments",
      ],
      languages: ["Nepali", "English", "Hindi", "Newari"],
      isVerified: true,
      avgRating: 4.7,
      totalReviews: 203,
      totalBookings: 580,
      communityImpactScore: 8.5,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-09-10T06:00:00Z"),
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. ANNAPURNA SUNRISE YOGA & MEDITATION RETREAT
    // ─────────────────────────────────────────────────────────────────────────────
    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Annapurna Sunrise Yoga & Meditation Retreat",
      description:
        "A transformative 3-day retreat in the foothills of Annapurna, combining yoga, meditation, and Himalayan wellness traditions. Practice sunrise yoga with panoramic mountain views, learn Ayurvedic cooking, participate in singing bowl meditation, and hike to a sacred cave temple. Accommodation in an eco-lodge with organic farm-to-table meals.",
      shortDescription:
        "Yoga and meditation retreat nestled in the Annapurna foothills with Himalayan wellness traditions.",
      category: "WELLNESS",
      pricePerPerson: 12000,
      currency: "NPR",
      durationHours: 72,
      maxGuests: 10,
      locationName: "Australian Camp, Kaski",
      latitude: 28.334,
      longitude: 83.8145,
      district: "Kaski",
      province: "Gandaki",

      // Annapurna Massif panorama — Wikimedia Commons featured picture (6914px wide!)
      thumbnail:
        "https://imgs.search.brave.com/iRAw01id5WUDWp4g7Crm9ILoNdbYhFTxBKyaIQqydTM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5uZXBhbHRyZWth/ZHZlbnR1cmVzLmNv/bS91cGxvYWRzL2lt/Zy9uZXBhbC15b2dh/LWJhbm5lci53ZWJw",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Annapurna_Massif_Panorama.jpg/1280px-Annapurna_Massif_Panorama.jpg",
        // Annapurna from Pokhara valley
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Annapurna_South%2C_Himchuli%2C_Machapuchare_Himal-3794.jpg/1280px-Annapurna_South%2C_Himchuli%2C_Machapuchare_Himal-3794.jpg",
        // Domestic yak at Letdar on Annapurna Circuit (serene mountain life)
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Bos_grunniens_at_Letdar_on_Annapurna_Circuit.jpg/1280px-Bos_grunniens_at_Letdar_on_Annapurna_Circuit.jpg",
      ],

      // 360° panoramas — Sarangkot & Australian Camp area above Pokhara
      panoramaImages: [
        "https://www.360cities.net/image/svami",
        "https://www.360cities.net/image/sarangkot-viewpoint-pokhara-nepal",
      ],

      // Google Maps Street View — Sarangkot viewpoint above Pokhara (mountain roads captured)
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFGMVFpcE1LeldfSmFleWFPckJLMkVZbWl2VldFNVlPeFl4cnJCaWt0eFV6!2m2!1d28.334!2d83.8145!3f90!4f-10!5f0.7820865974627469",

      amenities: [
        "Yoga sessions",
        "Meditation",
        "Organic meals",
        "Eco-lodge",
        "Singing bowls",
        "Nature hikes",
      ],
      languages: ["Nepali", "English"],
      isVerified: true,
      avgRating: 4.9,
      totalReviews: 68,
      totalBookings: 190,
      communityImpactScore: 9.0,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-10-01T05:30:00Z"),
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 6. NEWARI COOKING CLASS & FOOD TOUR
    // ─────────────────────────────────────────────────────────────────────────────
    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Newari Cooking Class & Food Tour",
      description:
        "Discover the rich culinary heritage of the Newar people in this hands-on cooking class and food walking tour through Kathmandu's old streets. Learn to prepare traditional dishes like Wo (lentil pancake), Chatamari (Newari pizza), Yomari, and more. Visit local spice markets, hidden food stalls, and a traditional kitchen.",
      shortDescription:
        "Hands-on Newari cooking class with a food walking tour through Kathmandu's ancient streets.",
      category: "FOOD_TOUR",
      pricePerPerson: 4000,
      currency: "NPR",
      durationHours: 6,
      maxGuests: 10,
      locationName: "Asan, Kathmandu",
      latitude: 27.708,
      longitude: 85.3118,
      district: "Kathmandu",
      province: "Bagmati",

      // Asan Tole / Kathmandu old bazaar — Wikimedia Commons
      thumbnail:
        "https://imgs.search.brave.com/qBqyRib9OlQIyPjmUhW5prWg408B0zBAh2T7yixGrNs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/Zm9vdHByaW50YWR2/ZW50dXJlLmNvbS91/cGxvYWRzL3BhY2th/Z2UvZnVsbC1kYXkt/bmVwYWxpLWNvb2tp/bmctY2xhc3MuanBn",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Kathmandu_Durbar_Square_%28Basantapur%29.jpg/1280px-Kathmandu_Durbar_Square_%28Basantapur%29.jpg",
        // Spice market Kathmandu
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Kathmandu_street_market.jpg/1280px-Kathmandu_street_market.jpg",
        // Bhaktapur women with traditional food/craft (Newari culture)
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Newar_people_Nepal.jpg/1024px-Newar_people_Nepal.jpg",
      ],

      // 360° panorama — Kathmandu old town / Thamel area
      panoramaImages: [
        "https://www.360cities.net/embed_iframe/kathmandu-thamel-nepal",
        "https://www.360cities.net/embed_iframe/asan-kathmandu-nepal",
      ],

      // Google Maps Street View — Asan Tole / old Kathmandu bazar (fully mapped)
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFGMVFpcE1kS21mX0o5NUpyVFZlRUhDWldRZFUzZjZfM2F2blFBcVZ6WUd4!2m2!1d27.708!2d85.3118!3f0!4f0!5f0.7820865974627469",

      amenities: [
        "Cooking ingredients",
        "Recipe booklet",
        "Market tour",
        "Full meal",
        "Local guide",
      ],
      languages: ["Nepali", "English"],
      isVerified: true,
      avgRating: 4.8,
      totalReviews: 156,
      totalBookings: 420,
      communityImpactScore: 8.3,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-11-05T06:00:00Z"),
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 7. LANGTANG VALLEY CULTURAL TREK
    // ─────────────────────────────────────────────────────────────────────────────
    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Langtang Valley Cultural Trek",
      description:
        "A 7-day trek through the Langtang Valley — known as the valley of glaciers. Walk through Tamang villages rebuilt after the 2015 earthquake, visit ancient gompas, taste yak cheese at the world's highest cheese factory, and witness the resilience of mountain communities firsthand. This trek directly supports earthquake recovery efforts.",
      shortDescription:
        "Trek through the Langtang Valley visiting Tamang villages and supporting earthquake recovery.",
      category: "TREKKING",
      pricePerPerson: 45000,
      currency: "NPR",
      durationHours: 168,
      maxGuests: 10,
      locationName: "Langtang National Park",
      latitude: 28.2139,
      longitude: 85.52,
      district: "Rasuwa",
      province: "Bagmati",

      // Langtang village and Himalayas at sunset — from search results
      thumbnail:
        "https://imgs.search.brave.com/HNwdz9nBFlnVuT4gPQP61CPVdLUKglXFxBpVR4jETYs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/dGFrZW9ubmVwYWwu/Y29tLmF1L3dwLWNv/bnRlbnQvdXBsb2Fk/cy9MYW5ndGFuZy1W/YWxsZXktU2hpcnQt/VHJlay4uanBn",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Langtang_National_Park.jpg/1280px-Langtang_National_Park.jpg",
        // Tamang gompa / monastery in mountains
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Kyanjin_Gompa_Langtang.jpg/1024px-Kyanjin_Gompa_Langtang.jpg",
        // Langtang valley glaciers
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Langtang_lirung.jpg/1280px-Langtang_lirung.jpg",
      ],

      // 360° panoramas — Langtang region
      panoramaImages: [
        "https://www.360cities.net/image/khola-river-langtang-in-nepal",
      ],

      // Google Maps Street View — Langtang area approach road (Rasuwa)
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFGMVFpcE5OZ0pCaHhZSWxlcEl2VVBUXzBFNWlwYVcyMkc1R0pHV0tfMlha!2m2!1d28.2139!2d85.52!3f0!4f0!5f0.7820865974627469",

      amenities: [
        "Experienced guide",
        "Porter support",
        "Permits",
        "Teahouse stays",
        "Meals included",
      ],
      languages: ["Nepali", "English", "Tamang"],
      isVerified: true,
      avgRating: 4.7,
      totalReviews: 42,
      totalBookings: 95,
      communityImpactScore: 9.8,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-05-15T05:00:00Z"),
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 8. POKHARA LAKESIDE KAYAKING & VILLAGE EXPERIENCE
    // ─────────────────────────────────────────────────────────────────────────────
    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Pokhara Lakeside Kayaking & Village Experience",
      description:
        "Paddle across the serene Phewa Lake with views of the Annapurna range reflected in its waters. After kayaking, visit a lakeside fishing village, learn traditional net-casting techniques, and enjoy a fresh fish lunch prepared by local families. End the day with a peaceful boat ride to the Tal Barahi Temple island.",
      shortDescription:
        "Kayak on Phewa Lake, visit a fishing village, and explore Pokhara's natural beauty.",
      category: "ADVENTURE",
      pricePerPerson: 3000,
      currency: "NPR",
      durationHours: 6,
      maxGuests: 8,
      locationName: "Phewa Lake, Pokhara",
      latitude: 28.2096,
      longitude: 83.9563,
      district: "Kaski",
      province: "Gandaki",

      // Phewa Lake Pokhara — Wikimedia Commons
      thumbnail:
        "https://imgs.search.brave.com/0IJBq_xL7AHPinzWnjChpwVPvftS-ulcAr5yGScKIKo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTMw/MjM1NTMwMy9waG90/by9yb3dpbmctYm9h/dHMtYnktbGFrZXNp/ZGUtYXQtcG9raGFy/YS5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9NXBnd0FMX1hM/WW5BbUUxYU42UXNJ/QzZWLWpVb3R1c2Nh/RS1WQ3VGT0ttND0",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Fewa_lake_Pokhara.jpg/1280px-Fewa_lake_Pokhara.jpg",
        // Pokhara from above — ACAP aerial
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Pokhara_valley_Himalayas.jpg/1280px-Pokhara_valley_Himalayas.jpg",
        // Machapuchare (Fishtail) reflected in Phewa Lake
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Machapuchare_from_Pokhara.jpg/1280px-Machapuchare_from_Pokhara.jpg",
      ],

      // 360° panoramas — Phewa Lake & Pokhara views
      panoramaImages: [
        "https://www.360cities.net/image/begnas-lake-in-pokhara-nepal#0.00,0.00,70.0",
        "https://www.360cities.net/image/barahi-temple-nepal-2"
      ],

      // Google Maps Street View — Phewa Lake Pokhara lakeside (confirmed in Google launch)
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFGMVFpcE5sSmxSOW5kVURKVjdFYUp2ZGJVUlZQWXNGcXhkbnQ3Y3JvR0N4!2m2!1d28.2096!2d83.9563!3f0!4f0!5f0.7820865974627469",

      amenities: [
        "Kayak gear",
        "Life jacket",
        "Fish lunch",
        "Village tour",
        "Temple visit",
      ],
      languages: ["Nepali", "English"],
      isVerified: true,
      avgRating: 4.6,
      totalReviews: 92,
      totalBookings: 310,
      communityImpactScore: 7.5,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-12-01T06:00:00Z"),
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 9. BHAKTAPUR POTTERY & CERAMICS WORKSHOP
    // ─────────────────────────────────────────────────────────────────────────────
    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Bhaktapur Pottery & Ceramics Workshop",
      description:
        "Get your hands dirty at Pottery Square in Bhaktapur, where families have been shaping clay for over 800 years. Learn traditional wheel-throwing and hand-building techniques from a multigenerational potter family. Create your own piece, learn about the cultural significance of Newari pottery, and explore the atmospheric square lined with drying pots.",
      shortDescription:
        "Learn 800-year-old pottery techniques at Bhaktapur's iconic Pottery Square.",
      category: "WORKSHOP",
      pricePerPerson: 3500,
      currency: "NPR",
      durationHours: 5,
      maxGuests: 8,
      locationName: "Pottery Square, Bhaktapur",
      latitude: 27.671,
      longitude: 85.4292,
      district: "Bhaktapur",
      province: "Bagmati",

      // Clay pots Bhaktapur — Wikimedia Commons featured picture
      thumbnail:
        "https://imgs.search.brave.com/6bkbp9IbmMYX76cqSNWJQz9Hf5oMVDSASyKFz_YII8I/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90cmlw/aml2ZS5jb20vd3At/Y29udGVudC91cGxv/YWRzLzIwMjQvMTAv/Qmhha3RhcHVyLXBv/dHRlcnktd29ya3No/b3BzLTEwMjR4NTg1/LmpwZw",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Clay_Pots-BW-IMG_7303.jpg/1280px-Clay_Pots-BW-IMG_7303.jpg",
        // Pottery Square Bhaktapur street view atmosphere
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Durbar_Square_of_Bhaktapur.jpg/1280px-Durbar_Square_of_Bhaktapur.jpg",
        // Bhaktapur Nyatapola — iconic backdrop near Pottery Square
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Nyatapola_Temple%2C_Bhaktapur.jpg/1024px-Nyatapola_Temple%2C_Bhaktapur.jpg",
      ],

      // 360° panoramas — Bhaktapur Pottery Square (Bolache Tole)
      // Confirmed in Google's Nepal Street View launch as one of the featured spots
      panoramaImages: [
        "https://www.360cities.net/image/baktapur-goal-madhi-road-kathmandu-2#0.00,0.00,70.0",
      ],

      // Google Maps Street View — Bolache Tole / Potter's Square, Bhaktapur
      // This specific location was called out in Google's official Street View Nepal launch
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFHMVFpcE5pRUxoSTcwWFQxeEFtd1RUMzhtZHNod3VCOU5rdmFLZlJaUEFr!2m2!1d27.671!2d85.4292!3f90!4f0!5f0.7820865974627469",

      amenities: [
        "Clay materials",
        "Expert instruction",
        "Take-home pottery",
        "Traditional tea",
        "Cultural tour",
      ],
      languages: ["Nepali", "English", "Newari"],
      isVerified: true,
      avgRating: 4.7,
      totalReviews: 78,
      totalBookings: 200,
      communityImpactScore: 8.6,
      approvalStatus: "APPROVED",
      createdAt: new Date("2024-01-10T06:00:00Z"),
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // 10. LUMBINI BUDDHIST PILGRIMAGE TOUR
    // ─────────────────────────────────────────────────────────────────────────────
    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Lumbini Buddhist Pilgrimage Tour",
      description:
        "Visit the birthplace of Lord Buddha in Lumbini, a UNESCO World Heritage Site. Explore the sacred garden, Maya Devi Temple, the Ashoka Pillar, and monasteries built by Buddhist nations from around the world. Includes meditation sessions with resident monks, a peace pagoda visit, and insights into the history and philosophy of Buddhism.",
      shortDescription:
        "Pilgrimage to Lumbini, the birthplace of Buddha, with guided monastery tours and meditation.",
      category: "HERITAGE_SITE",
      pricePerPerson: 6000,
      currency: "NPR",
      durationHours: 10,
      maxGuests: 20,
      locationName: "Lumbini Sacred Garden",
      latitude: 27.4833,
      longitude: 83.2767,
      district: "Rupandehi",
      province: "Lumbini",

      // Maya Devi Temple Lumbini — Wikimedia Commons
      thumbnail:
        "https://imgs.search.brave.com/ZXutRySFX60cmUO1K0Pmo0lBZaPReUcQifEjbmf7m8A/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/bmVwYWx0b3Vyc2Rl/c3RpbmF0aW9uLmNv/bS91cGxvYWRzL1Ry/aXAvdGh1bWJuYWls/L2x1bWJpbmktdG91/cl8xNTYxNTQ5OTIx/LmpwZw",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Maya_Devi_Temple%2C_Lumbini.jpg/1280px-Maya_Devi_Temple%2C_Lumbini.jpg",
        // Ashoka pillar Lumbini partial view
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Ashoka_Pillar_at_Lumbini.jpg/1024px-Ashoka_Pillar_at_Lumbini.jpg",
        // German/International monastery Lumbini
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/German_Monastry%2C_Lumbini_Nepal_AjayMaharjan.jpg/1280px-German_Monastry%2C_Lumbini_Nepal_AjayMaharjan.jpg",
      ],

      // 360° panoramas — Lumbini sacred garden
      panoramaImages: [
        "https://www.360cities.net/embed_iframe/lumbini-sacred-garden-nepal",
        "https://www.360cities.net/embed_iframe/world-peace-pagoda-lumbini",
      ],

      // Google Maps Street View — Lumbini (Terai plains coverage confirmed in launch)
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFHMVFpcE5lS0N4QUZUdEx5d1dnYWMydVJXQWtJNlJJSnhudUxJdThERXhw!2m2!1d27.4833!2d83.2767!3f0!4f0!5f0.7820865974627469",

      amenities: [
        "Expert Buddhist guide",
        "Meditation session",
        "Monastery visits",
        "Lunch",
        "Transport",
      ],
      languages: ["Nepali", "English", "Hindi"],
      isVerified: true,
      avgRating: 4.8,
      totalReviews: 145,
      totalBookings: 450,
      communityImpactScore: 8.0,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-09-20T05:45:00Z"),
    },

    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Boudhanath Stupa Pilgrimage & Tibetan Culture Walk",
      description:
        "Circle the magnificent Boudhanath Stupa — one of the largest Buddhist stupas in the world and a UNESCO World Heritage Site — with a Tibetan Buddhist guide. Learn about the significance of the stupa's architecture, join the kora (circumambulation) with monks and pilgrims, visit monastery rooftops with sweeping views, and explore the Tibetan shops and thangka galleries surrounding the stupa.",
      shortDescription:
        "Guided kora around Boudhanath Stupa with Tibetan culture, monastery rooftops & pilgrim rituals.",
      category: "HERITAGE_SITE",
      pricePerPerson: 3000,
      currency: "NPR",
      durationHours: 5,
      maxGuests: 12,
      locationName: "Boudhanath, Kathmandu",
      latitude: 27.7215,
      longitude: 85.3619,
      district: "Kathmandu",
      province: "Bagmati",

      thumbnail:
        "https://imgs.search.brave.com/-UEH-Wqdmvm0dV4kgazKLL_YbzWGJl5TBoSDPFTd_Pc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/dmFjYXRpb25pbmRp/YS5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjIvMDkvMTEt/Qm91ZGhhbmF0aC1z/dHVwYS1UaWJldGFu/LW5ldy15ZWFyLUth/dGhtYW5kdS5qcGc",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Boudhanath_stupa_%28Kathmandu%2C_Nepal%29.jpg/1280px-Boudhanath_stupa_%28Kathmandu%2C_Nepal%29.jpg",
        // Prayer flags + stupa
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Boudhanath_stupa_2.jpg/1280px-Boudhanath_stupa_2.jpg",
        // Aerial view of Boudhanath complex
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Boudhanath_Stupa_Kathmandu_Nepal.jpg/1280px-Boudhanath_Stupa_Kathmandu_Nepal.jpg",
      ],

      // 360° panoramas — Boudhanath (one of the most-photographed 360 spots in Nepal)
      panoramaImages: [
        "https://www.360cities.net/embed_iframe/boudhanath-stupa-kathmandu",
        "https://www.360cities.net/ge/image/boudhanath-stupa-in-kathmandu-nepal#45.76,7.47,67.2",
      ],

      // Google Maps Street View — Boudhanath Stupa circumambulation path
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFHMVFpcE5VZGZIMXhkVldCam4yUnVITHZuU3VSdkltMXhWV2o4cDJCUFFm!2m2!1d27.7215!2d85.3619!3f180!4f0!5f0.7820865974627469",

      amenities: [
        "Tibetan guide",
        "Monastery rooftop access",
        "Meditation sit",
        "Tibetan butter tea",
        "Thangka gallery tour",
      ],
      languages: ["Nepali", "English", "Tibetan"],
      isVerified: true,
      avgRating: 4.9,
      totalReviews: 234,
      totalBookings: 680,
      communityImpactScore: 8.7,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-06-01T06:00:00Z"),
    },

    {
      providerId: "REPLACE_WITH_PROVIDER_UUID",
      title: "Kathmandu Durbar Square & Swayambhunath Living Heritage Tour",
      description:
        "Explore two of Kathmandu's most iconic UNESCO World Heritage Sites in one immersive day. Begin at Kathmandu Durbar Square (Hanuman Dhoka), meeting the living Kumari goddess, exploring Taleju Temple and the Nautale Durbar palace. Then ascend to Swayambhunath (Monkey Temple) for sunrise panoramas of the Kathmandu Valley, learn about Buddhist iconography from resident monks, and descend through pilgrim paths.",
      shortDescription:
        "UNESCO double-feature: Hanuman Dhoka palace complex & Swayambhunath Monkey Temple with valley views.",
      category: "HERITAGE_SITE",
      pricePerPerson: 3500,
      currency: "NPR",
      durationHours: 7,
      maxGuests: 15,
      locationName: "Kathmandu Durbar Square & Swayambhunath",
      latitude: 27.7041,
      longitude: 85.3075,
      district: "Kathmandu",
      province: "Bagmati",

      // Kathmandu Durbar Square / Hanuman Dhoka — Wikimedia Commons
      thumbnail:
        "https://imgs.search.brave.com/wZjXl7QBFOt5PRy16tYXgRv9J9B7TISXHDT8bWlIhsg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/YmVzdGhlcml0YWdl/dG91ci5jb20vcHVi/bGljL2ltYWdlcy91/cGxvYWQvcGFja2Fn/ZS9zd3lhbWJodW5h/dGgtc3R1cGEuanBn",

      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Kathmandu_Durbar_Square_%28Basantapur%29.jpg/1280px-Kathmandu_Durbar_Square_%28Basantapur%29.jpg",
        // Swayambhunath stupa and valley panorama
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Swayambhunath_stupa_Kathmandu_Nepal.jpg/1280px-Swayambhunath_stupa_Kathmandu_Nepal.jpg",
        // Hanuman Dhoka / old palace detail
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Hanuman_Dhoka_at_Basantapur_Durbar_Square.jpg/1356px-Hanuman_Dhoka_at_Basantapur_Durbar_Square.jpg",
      ],

      // 360° panoramas — Kathmandu valley & Swayambhunath
      panoramaImages: [
        // Featured in Google's Nepal Street View launch blog as a top location
        "https://www.360cities.net/image/nepal-2017-kathmandu-durbar-square-stone-pillar-pratap-dhwaja#18.90,14.20,64.1",
        "https://www.360cities.net/image/bandipur-night-view-gaun-ghar-hotel-nepal",
      ],

      // Google Maps Street View — Kathmandu Durbar Square
      // Confirmed in Google's official launch: "Kathmandu Durbar Square: A UNESCO World Heritage site"
      streetViewUrl:
        "https://www.google.com/maps/embed?pb=!4v1&pbh=0!6m8!1m7!1sCAoSLEFHMVFpcE10QUFIekVDLWhuU2l5QWFYeXZ2cVk5aE9jR01qbWlSYU1hTFlk!2m2!1d27.7041!2d85.3075!3f0!4f10!5f0.7820865974627469",

      amenities: [
        "Expert heritage guide",
        "Kumari square visit",
        "Sunrise at Swayambhunath",
        "Monkey Temple climb",
        "Valley panorama",
        "Refreshments",
      ],
      languages: ["Nepali", "English", "Hindi"],
      isVerified: true,
      avgRating: 4.8,
      totalReviews: 312,
      totalBookings: 820,
      communityImpactScore: 8.4,
      approvalStatus: "APPROVED",
      createdAt: new Date("2023-03-15T06:00:00Z"),
    },

  ];

  const passwordHash = await bcrypt.hash("provider123", 10);

  const result = await prisma.$transaction(async (tx) => {
    const existingProvider = await tx.user.findUnique({
      where: { id: DEFAULT_PROVIDER_ID },
    });

    const provider = existingProvider || await tx.user.upsert({
      where: { email: DEFAULT_PROVIDER_EMAIL },
      update: {
        fullName: "Nepal Heritage Provider",
        role: "provider",
        isVerified: true,
      },
      create: {
        id: DEFAULT_PROVIDER_ID,
        email: DEFAULT_PROVIDER_EMAIL,
        passwordHash,
        fullName: "Nepal Heritage Provider",
        role: "provider",
        isVerified: true,
      },
    });

    const seededExperiences = [];

    for (const experience of experiences) {
      const { providerId: _providerId, ...data } = experience;
      const normalizedData = {
        ...data,
        panoramaImages: data.panoramaImages.map(normalizePanoramaUrl),
      };

      const seeded = await tx.experience.upsert({
        where: {
          providerId_title: {
            providerId: provider.id,
            title: normalizedData.title,
          },
        },
        update: {
          ...normalizedData,
          providerId: provider.id,
        },
        create: {
          ...normalizedData,
          providerId: provider.id,
        },
      });

      seededExperiences.push(seeded);
    }

    return { provider, experiences: seededExperiences };
  });

  return res.status(200).json(new ApiResponse(200, "Experiences initialized successfully", {
    provider: {
      id: result.provider.id,
      email: result.provider.email,
      full_name: result.provider.fullName,
    },
    count: result.experiences.length,
    experiences: result.experiences.map((experience) => ({
      id: experience.id,
      title: experience.title,
      category: experience.category.toLowerCase(),
    })),
  }));
});

const GetExperiences = asyncHandler(async (req, res) => {
  const { category, search, sort } = req.query;

  const where = {
    approvalStatus: "APPROVED",
  };

  if (category) {
    where.category = String(category).toUpperCase();
  }

  if (search) {
    const query = String(search);
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { locationName: { contains: query, mode: "insensitive" } },
      { district: { contains: query, mode: "insensitive" } },
    ];
  }

  const orderBy = (() => {
    switch (sort) {
      case "price_low":
        return { pricePerPerson: "asc" };
      case "price_high":
        return { pricePerPerson: "desc" };
      case "popular":
        return { totalBookings: "desc" };
      case "rating":
      default:
        return { avgRating: "desc" };
    }
  })();

  const experiences = await prisma.experience.findMany({
    where,
    orderBy,
  });

  return res.status(200).json(new ApiResponse(
    200,
    "Experiences fetched successfully",
    experiences.map(toExperienceResponse)
  ));
});

const GetExperienceById = asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(400).json(new ApiResponse(400, "Invalid experience id", null));
  }

  const experience = await prisma.experience.findUnique({
    where: { id: req.params.id },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!experience) {
    return res.status(404).json(new ApiResponse(404, "Experience not found", null));
  }

  return res.status(200).json(new ApiResponse(
    200,
    "Experience fetched successfully",
    toExperienceResponse(experience)
  ));
});

const GetExperienceCategories = asyncHandler(async (_req, res) => {
  const categories = [
    "homestay",
    "workshop",
    "guide",
    "heritage_site",
    "food_tour",
    "trekking",
    "adventure",
    "wellness",
  ];

  return res.status(200).json(new ApiResponse(200, "Categories fetched successfully", categories));
});

export {
  GetExperienceById,
  GetExperienceCategories,
  GetExperiences,
  GetProviderDashboard,
  GetProviderLatestReviews,
  InitExperiences,
  createProviderExperience
};
