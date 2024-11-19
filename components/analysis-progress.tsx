"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"

interface ProgressData {
  stage: string
  percent: number
  message: string
  details: Record<string, any>
}

const stageNames = {
  initializing: "初始化",
  analyzing_cooccurrence: "分析共现词",
  calculating_volume: "计算搜索量",
  analyzing_competitors: "分析竞争关键词",
  completed: "分析完成",
  error: "发生错误",
}

export function AnalysisProgress({ analysisId }: { analysisId: number }) {
  const [progress, setProgress] = useState<ProgressData | null>(null)

  useEffect(() => {
    const ws = new WebSocket(
      `ws://localhost:8000/api/v1/keyword/ws/analysis/${analysisId}`
    )

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setProgress(data)
    }

    return () => {
      ws.close()
    }
  }, [analysisId])

  if (!progress) return null

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {stageNames[progress.stage as keyof typeof stageNames]}
        </h3>
        <span className="text-sm text-muted-foreground">
          {progress.percent}%
        </span>
      </div>
      <Progress value={progress.percent} />
      <p className="text-sm text-muted-foreground">{progress.message}</p>
    </Card>
  )
} 