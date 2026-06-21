import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { AdminLoginForm } from "@/components/admin/admin-login-form"
import { ShieldCheck } from "lucide-react"

export const metadata = {
  title: "Admin sign in — Go Teach Yourself",
}

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin")

  return (
    <main className="flex min-h-svh items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="font-serif text-2xl font-semibold text-foreground">Platform admin</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage pricing and view platform analytics.
            </p>
          </div>
        </div>
        <AdminLoginForm />
        <p className="text-center text-xs text-muted-foreground">
          This area is for platform operators only.
        </p>
      </div>
    </main>
  )
}
