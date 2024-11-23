"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const SidebarContext = React.createContext<{
  expanded: boolean
  setExpanded: (expanded: boolean) => void
}>({
  expanded: true,
  setExpanded: () => {},
})

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = React.useState(true)

  return (
    <SidebarContext.Provider value={{ expanded, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { expanded } = React.useContext(SidebarContext)

  return (
    <aside className={cn(
      "h-screen sticky top-0 bg-white border-r transition-all duration-300",
      expanded ? "w-64" : "w-16"
    )}>
      {children}
    </aside>
  )
}

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b">{children}</div>
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="overflow-y-auto h-[calc(100vh-4rem)]">{children}</div>
}

export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return <div className="p-2">{children}</div>
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <div className="mb-2">{children}</div>
}

export function SidebarMenuButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "w-full px-3 py-2 text-left rounded-md hover:bg-gray-100 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
