import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { AuthForm } from "@/components/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/dashboard")

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <Link href="/" className="mb-8 font-serif text-2xl font-semibold text-foreground">
        Curio
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start designing courses tailored to how you learn.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="sign-up" />
        </CardContent>
      </Card>
    </main>
  )
}
