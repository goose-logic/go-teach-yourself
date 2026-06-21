import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getAdminAnalytics } from "@/app/actions/admin"
import { AdminHeader } from "@/components/admin/admin-header"
import { PricingControls } from "@/components/admin/pricing-controls"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"

export const metadata = {
  title: "Admin dashboard — Go Teach Yourself",
}

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const analytics = await getAdminAnalytics()

  return (
    <div className="min-h-svh bg-secondary/20">
      <AdminHeader />
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Admin dashboard</h1>
          <p className="text-muted-foreground">
            Manage platform pricing and monitor growth, revenue, and course completion.
          </p>
        </div>

        <PricingControls settings={analytics.settings} />
        <AnalyticsDashboard analytics={analytics} />
      </main>
    </div>
  )
}
