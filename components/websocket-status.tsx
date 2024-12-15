"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface WebSocketStatus {
  connected: boolean
  error?: string
}

export function WebSocketStatus({ analysisId }: { analysisId: number | null }) {
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false
  })

  useEffect(() => {
    const handleWebSocketEvent = (event: CustomEvent) => {
      const { type, data } = event.detail
      
      switch (type) {
        case "connect":
          setStatus({ connected: true })
          break
        case "disconnect":
          setStatus({ connected: false })
          break
        case "error":
          setStatus({ connected: false, error: data.message })
          break
      }
    }

    window.addEventListener('websocket-status', handleWebSocketEvent as EventListener)

    return () => {
      window.removeEventListener('websocket-status', handleWebSocketEvent as EventListener)
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={cn(
          "w-3 h-3 rounded-full",
          status.connected ? "bg-green-500" : "bg-red-500"
        )}
        animate={{
          opacity: status.connected ? [1, 0.5, 1] : 1,
          scale: status.connected ? [1, 0.9, 1] : 1
        }}
        transition={{
          duration: 2,
          repeat: status.connected ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      <span className="text-sm text-gray-500">
        {status.error || (status.connected ? "已连接" : "未连接")}
      </span>
    </div>
  )
} 