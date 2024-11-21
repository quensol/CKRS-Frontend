"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface WebSocketStatus {
  connected: boolean
  lastMessage: string
  lastHeartbeat: string
  reconnectAttempts: number
  error?: string
}

export function WebSocketStatus({ analysisId }: { analysisId: number | null }) {
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    lastMessage: "无",
    lastHeartbeat: "无",
    reconnectAttempts: 0
  })

  // 监听全局WebSocket事件
  useEffect(() => {
    const handleWebSocketEvent = (event: CustomEvent) => {
      const { type, data } = event.detail
      
      switch (type) {
        case "connect":
          setStatus(prev => ({ ...prev, connected: true, error: undefined }))
          break
        case "disconnect":
          setStatus(prev => ({ ...prev, connected: false }))
          break
        case "message":
          setStatus(prev => ({ 
            ...prev, 
            lastMessage: new Date().toLocaleTimeString() 
          }))
          break
        case "heartbeat":
          setStatus(prev => ({ 
            ...prev, 
            lastHeartbeat: new Date().toLocaleTimeString() 
          }))
          break
        case "error":
          setStatus(prev => ({ 
            ...prev, 
            error: data.message,
            connected: false 
          }))
          break
        case "reconnect":
          setStatus(prev => ({ 
            ...prev, 
            reconnectAttempts: data.attempts 
          }))
          break
      }
    }

    // 添加事件监听
    window.addEventListener('websocket-status', handleWebSocketEvent as EventListener)

    return () => {
      window.removeEventListener('websocket-status', handleWebSocketEvent as EventListener)
    }
  }, [])

  return (
    <Card className="p-4 text-sm">
      <h3 className="font-medium mb-2">WebSocket状态</h3>
      <div className="space-y-1">
        <p>分析ID: {analysisId || '无'}</p>
        <p>连接状态: 
          <span className={status.connected ? "text-green-500" : "text-red-500"}>
            {status.connected ? " 已连接" : " 未连接"}
          </span>
        </p>
        <p>最后消息: {status.lastMessage}</p>
        <p>最后心跳: {status.lastHeartbeat}</p>
        <p>重连次数: {status.reconnectAttempts}</p>
        {status.error && (
          <p className="text-red-500">错误: {status.error}</p>
        )}
      </div>
    </Card>
  )
} 