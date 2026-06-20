import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { IntakeWizard } from "@/components/intake-wizard"

export default async function NewCoursePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  return (
    <main className="min-h-svh bg-secondary/30">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/dashboard" className="font-serif text-xl font-semibold text-foreground">
          Go Teach Yourself
        </Link>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </header>
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-4 md:pt-8">
        <IntakeWizard />
      </div>
    </main>
  )
}
