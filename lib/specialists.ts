// Mock specialist directory for the tutorial marketplace.
// Specialists are seeded/mock data; bookings and user reviews are persisted in
// the database (see lib/db/schema.ts) and merged in at read time.

export type SeedReview = {
  reviewerName: string
  rating: number
  comment: string
  daysAgo: number
}

export type Specialist = {
  id: string
  name: string
  title: string
  expertise: string // subject area, aligns with course subjects
  location: string
  bio: string
  priceCents: number // price per 1-hour session
  avatar: string
  verified: boolean
  // What the vetting process confirmed for this specialist.
  verification: {
    linkedinUrl: string
    referenceChecked: boolean
    sampleSessionPassed: boolean
    verifiedOn: string
  }
  seedRating: number // baseline average from seeded reviews
  seedReviewCount: number
  seedReviews: SeedReview[]
  sessions: number // sessions delivered (for social proof / earnings)
}

// The platform's commission on every session. Shown transparently to specialists.
export const PLATFORM_FEE_PERCENT = 18

export function feeBreakdown(priceCents: number, feePercent = PLATFORM_FEE_PERCENT) {
  const platformFeeCents = Math.round((priceCents * feePercent) / 100)
  const payoutCents = priceCents - platformFeeCents
  return { platformFeeCents, payoutCents, feePercent }
}

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

export function formatPricePrecise(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export const SPECIALISTS: Specialist[] = [
  {
    id: "amara-okafor",
    name: "Dr. Amara Okafor",
    title: "Former CISO · Threat Intelligence Lead",
    expertise: "Cybersecurity",
    location: "London, UK",
    bio: "Fifteen years defending banks and critical infrastructure from real attacks. I help learners move past theory into how breaches actually happen — and how to stop them. Sessions are hands-on: we walk through real incident write-ups, threat models, and the controls that matter.",
    priceCents: 12000,
    avatar: "/specialists/amara.png",
    verified: true,
    verification: {
      linkedinUrl: "https://www.linkedin.com/in/amara-okafor-ciso",
      referenceChecked: true,
      sampleSessionPassed: true,
      verifiedOn: "2026-03-12",
    },
    seedRating: 4.9,
    seedReviewCount: 38,
    seedReviews: [
      {
        reviewerName: "Tom H.",
        rating: 5,
        comment:
          "Amara walked me through a real breach scenario end to end. I finally understand the kill chain instead of just memorizing it.",
        daysAgo: 6,
      },
      {
        reviewerName: "Lena P.",
        rating: 5,
        comment: "Incredibly practical. She tailored the whole session to the gaps in my knowledge.",
        daysAgo: 21,
      },
      {
        reviewerName: "Raj S.",
        rating: 4,
        comment: "Brilliant depth. Ran slightly over time but worth every minute.",
        daysAgo: 44,
      },
    ],
    sessions: 212,
  },
  {
    id: "marcus-chen",
    name: "Marcus Chen",
    title: "Ex-Stripe Product Manager",
    expertise: "Product Management",
    location: "San Francisco, US",
    bio: "I shipped 0→1 products at Stripe and two startups before that. I coach on discovery, prioritization, and telling a story with metrics. Bring a real product problem and we'll work it together — roadmaps, PRDs, stakeholder buy-in.",
    priceCents: 9500,
    avatar: "/specialists/marcus.png",
    verified: true,
    verification: {
      linkedinUrl: "https://www.linkedin.com/in/marcus-chen-pm",
      referenceChecked: true,
      sampleSessionPassed: true,
      verifiedOn: "2026-02-28",
    },
    seedRating: 4.8,
    seedReviewCount: 27,
    seedReviews: [
      {
        reviewerName: "Aisha K.",
        rating: 5,
        comment: "Helped me reframe my entire roadmap around outcomes. My PM interview went great after this.",
        daysAgo: 9,
      },
      {
        reviewerName: "Diego M.",
        rating: 5,
        comment: "Clear, direct, and full of real examples from shipping at scale.",
        daysAgo: 33,
      },
    ],
    sessions: 156,
  },
  {
    id: "sofia-reyes",
    name: "Sofia Reyes",
    title: "Growth Lead · DTC & SaaS",
    expertise: "Digital Marketing",
    location: "Barcelona, ES",
    bio: "I've scaled paid and organic growth for DTC brands and SaaS startups. Sessions cover funnels, channel strategy, attribution, and the analytics that actually drive decisions. We'll audit your funnel and find the leaks.",
    priceCents: 8000,
    avatar: "/specialists/sofia.png",
    verified: true,
    verification: {
      linkedinUrl: "https://www.linkedin.com/in/sofia-reyes-growth",
      referenceChecked: true,
      sampleSessionPassed: true,
      verifiedOn: "2026-04-02",
    },
    seedRating: 4.7,
    seedReviewCount: 41,
    seedReviews: [
      {
        reviewerName: "Chris T.",
        rating: 5,
        comment: "She spotted three problems in my ad funnel in the first ten minutes. Hugely valuable.",
        daysAgo: 4,
      },
      {
        reviewerName: "Mona L.",
        rating: 4,
        comment: "Great practical advice on attribution. Would book again.",
        daysAgo: 18,
      },
    ],
    sessions: 188,
  },
  {
    id: "james-whitfield",
    name: "James Whitfield",
    title: "Senior ML Engineer",
    expertise: "Data Science & Machine Learning",
    location: "Toronto, CA",
    bio: "I build and ship machine learning systems in production. I help learners go from notebooks to real models — feature engineering, evaluation, and avoiding the traps that look fine offline and break in the real world.",
    priceCents: 14000,
    avatar: "/specialists/james.png",
    verified: true,
    verification: {
      linkedinUrl: "https://www.linkedin.com/in/james-whitfield-ml",
      referenceChecked: true,
      sampleSessionPassed: true,
      verifiedOn: "2026-01-19",
    },
    seedRating: 4.9,
    seedReviewCount: 19,
    seedReviews: [
      {
        reviewerName: "Priyanka R.",
        rating: 5,
        comment: "Explained gradient boosting better in 20 minutes than a whole course did. Patient and clear.",
        daysAgo: 12,
      },
    ],
    sessions: 94,
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    title: "Product Design Lead",
    expertise: "UX & Product Design",
    location: "Bengaluru, IN",
    bio: "Twelve years designing products people love. I review portfolios, run mock design critiques, and teach the research-to-prototype loop. Bring work in progress and we'll make it sharper together.",
    priceCents: 9000,
    avatar: "/specialists/priya.png",
    verified: true,
    verification: {
      linkedinUrl: "https://www.linkedin.com/in/priya-nair-design",
      referenceChecked: true,
      sampleSessionPassed: true,
      verifiedOn: "2026-03-30",
    },
    seedRating: 4.8,
    seedReviewCount: 31,
    seedReviews: [
      {
        reviewerName: "Sam W.",
        rating: 5,
        comment: "The portfolio review was brutally honest in the best way. My case studies are so much stronger now.",
        daysAgo: 7,
      },
      {
        reviewerName: "Yuki T.",
        rating: 5,
        comment: "Wonderful at explaining the 'why' behind design decisions.",
        daysAgo: 26,
      },
    ],
    sessions: 143,
  },
  {
    id: "daniel-brooks",
    name: "Daniel Brooks, CFA",
    title: "Former Hedge Fund Analyst",
    expertise: "Personal Finance & Investing",
    location: "New York, US",
    bio: "I spent a decade analyzing markets professionally. I teach the fundamentals of investing, portfolio construction, and reading financial statements — in plain language, with no jargon and no hype.",
    priceCents: 11000,
    avatar: "/specialists/daniel.png",
    verified: false,
    verification: {
      linkedinUrl: "https://www.linkedin.com/in/daniel-brooks-cfa",
      referenceChecked: true,
      sampleSessionPassed: false,
      verifiedOn: "",
    },
    seedRating: 4.6,
    seedReviewCount: 12,
    seedReviews: [
      {
        reviewerName: "Olivia G.",
        rating: 5,
        comment: "Demystified index funds and asset allocation for me completely. Calm and clear.",
        daysAgo: 15,
      },
    ],
    sessions: 61,
  },
]

export function getSpecialists() {
  return SPECIALISTS
}

export function getSpecialist(id: string) {
  return SPECIALISTS.find((s) => s.id === id) ?? null
}

export function getExpertiseAreas() {
  return Array.from(new Set(SPECIALISTS.map((s) => s.expertise))).sort()
}

// Generate mock availability slots for the next ~10 days, mornings and afternoons.
export function getAvailabilitySlots(specialistId: string) {
  const slots: { value: string; label: string }[] = []
  const times = [9, 11, 14, 16] // hours
  const now = new Date()
  // Deterministic-ish offset per specialist so they don't all look identical.
  const seed = specialistId.charCodeAt(0) % 3
  for (let day = 1; day <= 12; day++) {
    const date = new Date(now)
    date.setDate(now.getDate() + day)
    const weekday = date.getDay()
    if (weekday === 0 || weekday === 6) continue // skip weekends
    for (const h of times) {
      // vary which slots are "available"
      if ((day + h + seed) % 3 === 0) continue
      const slot = new Date(date)
      slot.setHours(h, 0, 0, 0)
      slots.push({
        value: slot.toISOString(),
        label: slot.toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
          month: "short",
        }) + ", " + slot.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      })
    }
  }
  return slots.slice(0, 18)
}
