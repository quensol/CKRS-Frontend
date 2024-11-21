"use client"

import { useEffect, useState, useRef } from "react"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"

interface ProgressDetails {
  // 初始化阶段
  keyword?: string
  // 分析共现词阶段
  current?: number
  total?: number
  found_words?: number
  // 计算搜索量阶段
  processed_words?: number
  // 分析竞争关键词阶段
  found_competitors?: number
  // 完成阶段
  total_volume?: number
  seed_volume?: number
  // 错误阶段
  error?: string
}

interface WebSocketMessage {
  type: "progress" | "heartbeat"
  stage?: keyof typeof stageNames
  percent?: number
  message?: string
  details?: ProgressDetails
}

const stageNames = {
  initializing: "初始化",
  analyzing_cooccurrence: "分析共现词",
  calculating_volume: "计算搜索量",
  analyzing_competitors: "分析竞争关键词",
  completed: "分析完成",
  error: "发生错误",
} as const

export function AnalysisProgress({ 
  analysisId, 
  onWsReady 
}: { 
  analysisId: number
  onWsReady?: () => void
}) {
  const [progress, setProgress] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const lastHeartbeatRef = useRef(Date.now())
  const heartbeatCheckIntervalRef = useRef<NodeJS.Timeout>()
  const analysisCompletedRef = useRef(false)

  const MAX_RECONNECT_ATTEMPTS = 5
  const HEARTBEAT_TIMEOUT = 35000
  const RECONNECT_DELAY = 3000

  useEffect(() => {
    // 先检查分析状态
    const checkAnalysisStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/keyword/analysis/${analysisId}`)
        if (!response.ok) throw new Error("获取分析状态失败")
        const data = await response.json()
        
        // 如果分析已完成或失败，直接显示结果，不建立WebSocket连接
        if (data.status === "completed" || data.status === "failed") {
          setProgress({
            type: "progress",
            stage: data.status === "completed" ? "completed" : "error",
            percent: data.status === "completed" ? 100 : 0,
            message: data.status === "completed" ? "分析已完成" : data.error_message || "分析失败",
            details: {
              total_volume: data.total_search_volume,
              seed_volume: data.seed_search_volume,
              error: data.error_message
            }
          })
          return false // 不需要建立WebSocket连接
        }
        return true // 需要建立WebSocket连接
      } catch (error) {
        console.error('检查分析状态失败:', error)
        return true // 出错时仍尝试建立WebSocket连接
      }
    }

    const dispatchStatusEvent = (type: string, data: Record<string, unknown> = {}) => {
      const event = new CustomEvent('websocket-status', {
        detail: { type, data }
      })
      window.dispatchEvent(event)
    }

    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }

      console.log(`正在连接WebSocket: analysisId=${analysisId}`)
      const ws = new WebSocket(`ws://localhost:8000/api/v1/keyword/ws/analysis/${analysisId}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket连接已建立')
        reconnectAttemptsRef.current = 0
        lastHeartbeatRef.current = Date.now()
        dispatchStatusEvent('connect')
        setProgress({
          type: "progress",
          stage: "initializing",
          percent: 0,
          message: "正在建立连接...",
          details: {}
        })
        onWsReady?.()
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data) as WebSocketMessage
        console.log('收到消息:', data)

        if (data.type === 'heartbeat') {
          lastHeartbeatRef.current = Date.now()
          dispatchStatusEvent('heartbeat')
          return
        }

        if (data.type === 'progress') {
          setProgress(data)
          dispatchStatusEvent('message')
          
          if (data.stage === 'completed' || data.stage === 'error') {
            analysisCompletedRef.current = true
            if (wsRef.current) {
              wsRef.current.close()
            }
          }
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        dispatchStatusEvent('error', { message: "WebSocket连接失败" })
        setProgress({
          type: "progress",
          stage: "error",
          percent: 0,
          message: "连接错误",
          details: { error: "WebSocket连接失败" }
        })
      }

      ws.onclose = (event) => {
        console.log('WebSocket连接关闭:', event.code)
        dispatchStatusEvent('disconnect')
        
        if (!analysisCompletedRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++
          dispatchStatusEvent('reconnect', { attempts: reconnectAttemptsRef.current })
          console.log(`尝试重连 (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`)
          setTimeout(connectWebSocket, RECONNECT_DELAY)
          setProgress(prev => ({
            type: "progress",
            stage: prev?.stage || "initializing",
            percent: prev?.percent || 0,
            message: `连接断开，正在重连 (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`,
            details: prev?.details || {}
          }))
        }
      }
    }

    const startHeartbeatCheck = () => {
      heartbeatCheckIntervalRef.current = setInterval(() => {
        const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current
        if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
          console.log('心跳超时，重新连接...')
          wsRef.current?.close()
        }
      }, 5000)
    }

    // 先检查状态，再决定是否建立WebSocket连接
    checkAnalysisStatus().then(shouldConnect => {
      if (shouldConnect) {
        connectWebSocket()
        startHeartbeatCheck()
      }
    })

    return () => {
      if (heartbeatCheckIntervalRef.current) {
        clearInterval(heartbeatCheckIntervalRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [analysisId])

  // 如果没有进度信息，显示加载状态
  if (!progress) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">正在连接...</h3>
          <span className="text-sm text-muted-foreground">0%</span>
        </div>
        <Progress value={0} />
      </Card>
    )
  }

  const renderStageDetails = () => {
    if (!progress.details || !progress.stage) return null
    const { stage, details } = progress

    switch (stage) {
      case "initializing":
        return <p>正在初始化分析关键词: {details.keyword}</p>

      case "analyzing_cooccurrence":
        return (
          <div className="space-y-1">
            <p>处理进度: {details.current}/{details.total}</p>
            <p>已发现关键词: {details.found_words}个</p>
          </div>
        )

      case "calculating_volume":
        return (
          <div className="space-y-1">
            <p>处理进度: {details.current}/{details.total}</p>
            <p>已处理词数: {details.processed_words}个</p>
          </div>
        )

      case "analyzing_competitors":
        return (
          <div className="space-y-1">
            <p>处理进度: {details.current}/{details.total}</p>
            <p>已发现竞争词: {details.found_competitors}个</p>
          </div>
        )

      case "completed":
        return (
          <div className="space-y-1">
            <p>总搜索量: {details.total_volume?.toLocaleString()}</p>
            <p>种子关键词搜索量: {details.seed_volume?.toLocaleString()}</p>
          </div>
        )

      case "error":
        return <p className="text-red-500">错误: {details.error}</p>

      default:
        return null
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {progress.stage ? stageNames[progress.stage] : "未知状态"}
        </h3>
        <span className="text-sm text-muted-foreground">
          {progress.percent || 0}%
        </span>
      </div>
      <Progress value={progress.percent || 0} />
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{progress.message || "等待进度更新..."}</p>
        <div className="text-sm">{renderStageDetails()}</div>
      </div>
    </Card>
  )
} 