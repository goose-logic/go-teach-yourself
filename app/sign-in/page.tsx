import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { AuthForm } from "@/components/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/dashboard")

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:left-8 md:top-8"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <Link href="/" className="mb-8 font-serif text-2xl font-semibold text-foreground">
        Curio
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to continue building your courses.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="sign-in" />
        </CardContent>
      </Card>
    </main>
  )
}
