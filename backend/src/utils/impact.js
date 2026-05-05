const IMPACT_RATES = Object.freeze({
  tax: 0.05,
  localEarnings: 0.72,
  communityFund: 0.08,
  platformFee: 0.12,
  operations: 0.08,
});

const CATEGORY_MEDALS = Object.freeze({
  HOMESTAY: "community-guest",
  WORKSHOP: "artisan-supporter",
  GUIDE: "heritage-explorer",
  HERITAGE_SITE: "heritage-guardian",
  FOOD_TOUR: "culinary-custodian",
  TREKKING: "trail-finisher",
  ADVENTURE: "responsible-adventurer",
  WELLNESS: "wellness-traveler",
});

const roundMoney = (value) => Math.max(0, Math.round(Number(value) || 0));

const calculateBookingImpact = ({ pricePerPerson, numGuests }) => {
  const baseAmount = roundMoney(pricePerPerson * numGuests);
  const taxAmount = roundMoney(baseAmount * IMPACT_RATES.tax);
  const localEarningsAmount = roundMoney(baseAmount * IMPACT_RATES.localEarnings);
  const communityFundAmount = roundMoney(baseAmount * IMPACT_RATES.communityFund);
  const platformFeeAmount = roundMoney(baseAmount * IMPACT_RATES.platformFee);
  const operationsAmount = Math.max(
    0,
    baseAmount - localEarningsAmount - communityFundAmount - platformFeeAmount
  );

  return {
    baseAmount,
    taxAmount,
    localEarningsAmount,
    communityFundAmount,
    platformFeeAmount,
    operationsAmount,
    totalAmount: baseAmount + taxAmount,
  };
};

const normalizeBookingImpact = (booking) => {
  const persistedBase = Number(booking.baseAmount || 0);
  const hasPersistedBreakdown =
    persistedBase > 0 &&
    Number(booking.localEarningsAmount || 0) > 0;

  if (hasPersistedBreakdown) {
    return {
      baseAmount: roundMoney(booking.baseAmount),
      taxAmount: roundMoney(booking.taxAmount),
      localEarningsAmount: roundMoney(booking.localEarningsAmount),
      communityFundAmount: roundMoney(booking.communityFundAmount),
      platformFeeAmount: roundMoney(booking.platformFeeAmount),
      operationsAmount: roundMoney(booking.operationsAmount),
      totalAmount: roundMoney(booking.totalAmount),
    };
  }

  if (booking.experience?.pricePerPerson) {
    return calculateBookingImpact({
      pricePerPerson: booking.experience.pricePerPerson,
      numGuests: booking.numGuests,
    });
  }

  const estimatedBase = roundMoney((booking.totalAmount || 0) / (1 + IMPACT_RATES.tax));
  const estimated = calculateBookingImpact({
    pricePerPerson: estimatedBase,
    numGuests: 1,
  });

  return {
    ...estimated,
    totalAmount: roundMoney(booking.totalAmount),
  };
};

const formatDistribution = (summary) => {
  const amount = summary.baseAmount + summary.taxAmount;

  return [
    {
      category: "Local hosts, guides and artisans",
      amount: summary.localEarningsAmount,
      percentage: amount ? Math.round((summary.localEarningsAmount / amount) * 100) : 0,
    },
    {
      category: "Community heritage fund",
      amount: summary.communityFundAmount,
      percentage: amount ? Math.round((summary.communityFundAmount / amount) * 100) : 0,
    },
    {
      category: "Platform fee",
      amount: summary.platformFeeAmount,
      percentage: amount ? Math.round((summary.platformFeeAmount / amount) * 100) : 0,
    },
    {
      category: "Operations and taxes",
      amount: summary.operationsAmount + summary.taxAmount,
      percentage: amount ? Math.round(((summary.operationsAmount + summary.taxAmount) / amount) * 100) : 0,
    },
  ];
};

const buildImpactSummary = (bookings) => {
  const uniqueProviders = new Set();
  const districts = new Map();

  const summary = bookings.reduce((acc, booking) => {
    const impact = normalizeBookingImpact(booking);
    const district = booking.experience?.district || "Unknown";
    const providerId = booking.experience?.providerId;

    if (providerId) uniqueProviders.add(providerId);

    acc.totalBookings += 1;
    acc.travelersServed += booking.numGuests;
    acc.baseAmount += impact.baseAmount;
    acc.taxAmount += impact.taxAmount;
    acc.totalRevenueGenerated += impact.totalAmount;
    acc.localEarningsAmount += impact.localEarningsAmount;
    acc.communityFundAmount += impact.communityFundAmount;
    acc.platformFeeAmount += impact.platformFeeAmount;
    acc.operationsAmount += impact.operationsAmount;

    const districtStats = districts.get(district) || {
      district,
      bookings: 0,
      travelers: 0,
      revenue: 0,
      local_earnings: 0,
      community_fund: 0,
    };
    districtStats.bookings += 1;
    districtStats.travelers += booking.numGuests;
    districtStats.revenue += impact.totalAmount;
    districtStats.local_earnings += impact.localEarningsAmount;
    districtStats.community_fund += impact.communityFundAmount;
    districts.set(district, districtStats);

    return acc;
  }, {
    totalBookings: 0,
    travelersServed: 0,
    baseAmount: 0,
    taxAmount: 0,
    totalRevenueGenerated: 0,
    localEarningsAmount: 0,
    communityFundAmount: 0,
    platformFeeAmount: 0,
    operationsAmount: 0,
  });

  return {
    total_bookings: summary.totalBookings,
    travelers_served: summary.travelersServed,
    total_revenue_generated: summary.totalRevenueGenerated,
    base_amount: summary.baseAmount,
    tax_amount: summary.taxAmount,
    local_earnings_amount: summary.localEarningsAmount,
    community_fund_amount: summary.communityFundAmount,
    platform_fee_amount: summary.platformFeeAmount,
    operations_amount: summary.operationsAmount,
    providers_supported: uniqueProviders.size,
    families_supported: uniqueProviders.size,
    districts_reached: [...districts.keys()].filter((district) => district !== "Unknown").length,
    community_share_percentage: summary.totalRevenueGenerated
      ? Math.round(((summary.localEarningsAmount + summary.communityFundAmount) / summary.totalRevenueGenerated) * 100)
      : 0,
    distribution: formatDistribution(summary),
    regional: [...districts.values()].sort((a, b) => b.revenue - a.revenue),
  };
};

const buildCertificatePayload = (booking) => {
  const impact = normalizeBookingImpact(booking);
  const title = `${booking.experience?.title || "Heritage Experience"} Achievement`;
  const medalType = CATEGORY_MEDALS[booking.experience?.category] || "heritage-supporter";

  return {
    title,
    medalType,
    certificateCode: `NHT-${booking.id.slice(0, 8).toUpperCase()}`,
    impactSummary: {
      booking_id: booking.id,
      experience_title: booking.experience?.title || "Heritage Experience",
      location_name: booking.experience?.locationName || null,
      district: booking.experience?.district || null,
      guests: booking.numGuests,
      currency: booking.currency,
      total_amount: impact.totalAmount,
      local_earnings_amount: impact.localEarningsAmount,
      community_fund_amount: impact.communityFundAmount,
      tax_amount: impact.taxAmount,
    },
  };
};

export {
  IMPACT_RATES,
  buildCertificatePayload,
  buildImpactSummary,
  calculateBookingImpact,
  normalizeBookingImpact,
};
