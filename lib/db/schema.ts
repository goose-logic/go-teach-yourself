import { pgTable, text, timestamp, boolean, serial, integer, jsonb } from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- App tables ------------------------------------------------------------

// A course the user is designing / studying.
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  goal: text("goal"),
  level: text("level").notNull().default("beginner"), // beginner | intermediate | advanced
  pace: text("pace").notNull().default("part_time"), // full_time | part_time
  hoursPerWeek: integer("hoursPerWeek").notNull().default(6),
  totalWeeks: integer("totalWeeks").notNull().default(8),
  startDate: timestamp("startDate"),
  status: text("status").notNull().default("generating"), // generating | active | completed
  summary: text("summary"),
  // Raw answers to the AI clarifying questions, kept for context / regeneration.
  intake: jsonb("intake"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Modules group lessons within a course.
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: integer("courseId").notNull(),
  userId: text("userId").notNull(),
  orderIndex: integer("orderIndex").notNull().default(0),
  weekNumber: integer("weekNumber").notNull().default(1),
  title: text("title").notNull(),
  summary: text("summary"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Individual lessons with full generated content (markdown).
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("moduleId").notNull(),
  courseId: integer("courseId").notNull(),
  userId: text("userId").notNull(),
  orderIndex: integer("orderIndex").notNull().default(0),
  title: text("title").notNull(),
  objective: text("objective"),
  content: text("content"), // full markdown lesson content
  durationMinutes: integer("durationMinutes").notNull().default(45),
  completed: boolean("completed").notNull().default(false),
  // Per-lesson formative check: array of { kind: "mcq" | "open", question, options?[], answerIndex?, explanation? }
  formativeQuestions: jsonb("formativeQuestions"),
  formativeCompleted: boolean("formativeCompleted").notNull().default(false),
  formativeScore: integer("formativeScore"),
  formativeFeedback: text("formativeFeedback"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Tests and project submissions.
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  courseId: integer("courseId").notNull(),
  moduleId: integer("moduleId"),
  userId: text("userId").notNull(),
  type: text("type").notNull().default("test"), // test | project
  title: text("title").notNull(),
  description: text("description"),
  weekNumber: integer("weekNumber").notNull().default(1),
  // For tests: array of { question, options[], answerIndex, explanation }
  // For projects: array of rubric/requirement strings
  questions: jsonb("questions"),
  category: text("category").notNull().default("summative"), // summative | final
  gradeWeight: integer("gradeWeight").notNull().default(0), // percentage weight (0-100) for grade calculation
  status: text("status").notNull().default("pending"), // pending | submitted | graded
  submission: text("submission"), // project text submission or notes
  fileName: text("fileName"), // original uploaded Word doc name, if any
  score: integer("score"), // 0-100
  feedback: text("feedback"),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// --- Specialist tutorial marketplace ---------------------------------------

// A booked one-on-one tutorial session with a specialist.
// Specialists themselves are mock/seeded data in lib/specialists.ts; bookings
// and reviews are real, persisted, and scoped to the signed-in user.
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(), // the learner who booked
  specialistId: text("specialistId").notNull(),
  specialistName: text("specialistName").notNull(),
  expertise: text("expertise").notNull(),
  sessionDate: timestamp("sessionDate").notNull(),
  slotLabel: text("slotLabel").notNull(), // human-friendly slot, e.g. "Wed 25 Jun, 2:00 PM"
  priceCents: integer("priceCents").notNull(),
  platformFeeCents: integer("platformFeeCents").notNull(),
  payoutCents: integer("payoutCents").notNull(),
  feePercent: integer("feePercent").notNull().default(18),
  status: text("status").notNull().default("upcoming"), // upcoming | completed | cancelled
  // Last 4 digits of the (mock) card used, for the receipt.
  cardLast4: text("cardLast4"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// A learner's rating + written review of a specialist, shown on the profile.
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(), // the reviewer
  bookingId: integer("bookingId"),
  specialistId: text("specialistId").notNull(),
  reviewerName: text("reviewerName").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Timetable entries mapping work onto weeks/days.
export const scheduleItems = pgTable("schedule_items", {
  id: serial("id").primaryKey(),
  courseId: integer("courseId").notNull(),
  userId: text("userId").notNull(),
  weekNumber: integer("weekNumber").notNull().default(1),
  dayLabel: text("dayLabel").notNull(), // e.g. "Mon"
  orderIndex: integer("orderIndex").notNull().default(0),
  title: text("title").notNull(),
  itemType: text("itemType").notNull().default("lesson"), // lesson | test | project | review
  refId: integer("refId"), // lesson or assessment id
  durationMinutes: integer("durationMinutes").notNull().default(45),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})
