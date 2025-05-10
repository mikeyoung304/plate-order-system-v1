import type React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
}

export function PageHeader({ title, description, children, actions, className, badge }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6",
        className,
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {badge && (
            <Badge variant={badge.variant || "default"} className="ml-2">
              {badge.text}
            </Badge>
          )}
        </div>
        {description && <p className="text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PageHeaderWithTime({
  title,
  description,
  children,
  className,
  badge,
}: Omit<PageHeaderProps, "actions">) {
  return (
    <PageHeader
      title={title}
      description={description}
      className={className}
      badge={badge}
      actions={
        <div className="flex flex-col items-end">
          <div className="flex items-center text-muted-foreground mb-1">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm">Current Time</span>
          </div>
          <span className="text-lg font-medium">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      }
    >
      {children}
    </PageHeader>
  )
}
