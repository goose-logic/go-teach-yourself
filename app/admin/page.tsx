import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getAdminAnalytics, getPageViewAnalytics, getLoginAnalytics } from "@/app/actions/admin"
import { AdminHeader } from "@/components/admin/admin-header"
import { PricingControls } from "@/components/admin/pricing-controls"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { PageViewsAnalytics } from "@/components/admin/page-views-analytics"
import { ProtectedLoginAnalytics } from "@/components/admin/protected-login-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Eye, Users } from "lucide-react"

export const metadata = {
  title: "Admin dashboard — Go Teach Yourself",
}

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const [analytics, pageViewData, loginData] = await Promise.all([
    getAdminAnalytics(),
    getPageViewAnalytics(),
    getLoginAnalytics(),
  ])

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

        <Tabs defaultValue="overview">
          <TabsList className="bg-muted border border-muted-foreground/40 p-1.5 h-auto gap-2 rounded-lg">
            <TabsTrigger 
              value="overview" 
              className="rounded-md px-4 py-2.5 gap-2 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-muted"
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="pageviews"
              className="rounded-md px-4 py-2.5 gap-2 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-muted"
            >
              <Eye className="w-4 h-4" />
              Page views
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="rounded-md px-4 py-2.5 gap-2 font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-muted"
            >
              <Users className="w-4 h-4" />
              Users &amp; logins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AnalyticsDashboard analytics={analytics} />
          </TabsContent>

          <TabsContent value="pageviews" className="mt-6">
            <PageViewsAnalytics data={pageViewData} />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <ProtectedLoginAnalytics data={loginData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
