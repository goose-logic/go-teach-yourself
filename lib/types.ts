import type { InferSelectModel } from "drizzle-orm"
import type { courses, modules, lessons, assessments, scheduleItems } from "@/lib/db/schema"

export type Course = InferSelectModel<typeof courses>
export type Module = InferSelectModel<typeof modules>
export type Lesson = InferSelectModel<typeof lessons>
export type Assessment = InferSelectModel<typeof assessments>
export type ScheduleItem = InferSelectModel<typeof scheduleItems>

export type TestQuestion = {
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type ProjectBrief = {
  brief: string
  requirements: string[]
  rubric: string[]
}

export type FormativeQuestion = {
  kind: "mcq" | "open"
  question: string
  options: string[] | null
  answerIndex: number | null
  sampleAnswer: string | null
  explanation: string
}

export type CourseDetail = {
  course: Course
  modules: Module[]
  lessons: Lesson[]
  assessments: Assessment[]
  schedule: ScheduleItem[]
  // Live, admin-controlled pricing (in cents).
  lateFeeCents: number
  courseUnlockFeeCents: number
}
