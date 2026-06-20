import { redirect, notFound } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCourseDetail } from "@/app/actions/courses"
import { AppHeader } from "@/components/app-header"
import { CourseView } from "@/components/course-view"

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { id } = await params
  const courseId = Number(id)
  if (Number.isNaN(courseId)) notFound()

  const detail = await getCourseDetail(courseId)
  if (!detail) notFound()

  return (
    <div className="min-h-svh bg-secondary/20">
      <AppHeader userName={session.user.name} />
      <CourseView detail={detail} />
    </div>
  )
}
