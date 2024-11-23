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
  onWsReady,
  onComplete  // 添加完成回调
}: { 
  analysisId: number
  onWsReady?: () => void
  onComplete?: () => void
}) {
  const [progress, setProgress] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const analysisCompletedRef = useRef(false)

  const MAX_RECONNECT_ATTEMPTS = 5
  const RECONNECT_DELAY = 3000

  // 添加dispatchStatusEvent函数定义
  const dispatchStatusEvent = (type: string, data: Record<string, unknown> = {}) => {
    const event = new CustomEvent('websocket-status', {
      detail: { type, data }
    })
    window.dispatchEvent(event)
  }

  useEffect(() => {
    let isSubscribed = true  // 添加订阅标志

    const checkAnalysisStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/keyword/analysis/${analysisId}`)
        if (!response.ok) throw new Error("获取分析状态失败")
        const data = await response.json()
        
        // 如果已经取消订阅，不继续处理
        if (!isSubscribed) return

        // 如果分析已完成或失败，直接显示结果，不建立WebSocket连接
        if (data.status === "completed" || data.status === "failed") {
          analysisCompletedRef.current = true
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
          return
        }

        // 只有在非完成状态时才建立WebSocket连接
        connectWebSocket(data.status)
      } catch (error) {
        console.error('检查分析状态失败:', error)
        if (isSubscribed) {
          connectWebSocket("unknown")
        }
      }
    }

    const connectWebSocket = (currentStatus: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }

      console.log(`正在连接WebSocket: analysisId=${analysisId}, status=${currentStatus}`)
      const ws = new WebSocket(`ws://localhost:8000/api/v1/keyword/ws/analysis/${analysisId}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket连接已建立')
        reconnectAttemptsRef.current = 0
        dispatchStatusEvent('connect')

        // 只在pending状态时通知准备就绪
        if (currentStatus === "pending") {
          console.log('状态为pending，通知准备就绪')
          onWsReady?.()
        } else {
          console.log(`当前状态为${currentStatus}，不触发准备就绪`)
        }
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data) as WebSocketMessage
        console.log('收到WebSocket消息:', data)

        if (data.type === 'progress') {
          setProgress(data)
          dispatchStatusEvent('message')
          
          // 如果收到完成消息，触发回调并关闭连接
          if (data.stage === 'completed' || data.stage === 'error') {
            // 防止重复处理完成状态
            if (!analysisCompletedRef.current) {
              analysisCompletedRef.current = true
              console.log('分析已完成，准备触发完成回调和关闭连接')
              if (data.stage === 'completed') {
                console.log('触发完成回调')
                onComplete?.()
              }
              console.log('关闭WebSocket连接')
              ws.close(1000)
            }
            return
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
        
        // 只在非正常关闭且未完成时尝试重连
        if (!analysisCompletedRef.current && event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
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

    // 启动初始状态检查
    checkAnalysisStatus()

    // 清理函数
    return () => {
      isSubscribed = false
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [analysisId, onWsReady, onComplete])

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