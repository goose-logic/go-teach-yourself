import { redirect, notFound } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCourseDetail } from "@/app/actions/courses"
import { AppHeader } from "@/components/app-header"
import { Certificate } from "@/components/certificate"

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { id } = await params
  const courseId = Number(id)
  if (Number.isNaN(courseId)) notFound()

  const detail = await getCourseDetail(courseId)
  if (!detail) notFound()

  // The certificate is only available once every lesson has been completed.
  const allComplete = detail.lessons.length > 0 && detail.lessons.every((l) => l.completed)
  if (!allComplete) redirect(`/course/${courseId}`)

  const completedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-svh bg-secondary/20">
      <AppHeader userName={session.user.name} />
      <Certificate
        learnerName={session.user.name}
        courseTitle={detail.course.title}
        courseId={courseId}
        totalWeeks={detail.course.totalWeeks}
        completedDate={completedDate}
      />
    </div>
  )
}
