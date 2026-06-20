"use client"

import { BadgeCheck, Clock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function VerifiedBadge({
  verified,
  size = "sm",
}: {
  verified: boolean
  size?: "sm" | "md"
}) {
  const text = size === "md" ? "text-sm" : "text-xs"
  const icon = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors",
              text,
              verified
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-secondary text-muted-foreground",
            )}
          >
            {verified ? <BadgeCheck className={icon} /> : <Clock className={icon} />}
            {verified ? "Verified Specialist" : "Verification pending"}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {verified ? (
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold text-foreground">How we vet specialists</p>
              <p className="text-muted-foreground">
                Every Verified Specialist has passed our three-step check before being allowed to list:
              </p>
              <ul className="flex flex-col gap-1 text-muted-foreground">
                <li className="flex items-start gap-1.5">
                  <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  Confirmed identity &amp; experience via their LinkedIn profile
                </li>
                <li className="flex items-start gap-1.5">
                  <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  A reference check with a past client or employer
                </li>
                <li className="flex items-start gap-1.5">
                  <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  A live sample-session interview with our team
                </li>
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">
              This specialist is partway through our three-step vetting (LinkedIn check, reference check, and a
              sample-session interview) and can&apos;t take bookings until it&apos;s complete.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
