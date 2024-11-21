"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { AnalysisProgress } from "./analysis-progress"
import { AnalysisResults } from "./analysis-results"
import { AnalysisBrief } from "@/types/analysis"

interface KeywordAnalyzerProps {
  onAnalysisIdChange?: (id: number | null) => void
}

export function KeywordAnalyzer({ onAnalysisIdChange }: KeywordAnalyzerProps) {
  const [keyword, setKeyword] = useState("")
  const [analysisId, setAnalysisId] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()
  const wsReadyRef = useRef(false)

  const updateAnalysisId = (id: number | null) => {
    setAnalysisId(id)
    onAnalysisIdChange?.(id)
  }

  const handleWsReady = async (id: number) => {
    wsReadyRef.current = true
    console.log('WebSocket已就绪，准备启动分析...')
    
    if (id && wsReadyRef.current) {
      try {
        const startResponse = await fetch(
          `http://localhost:8000/api/v1/keyword/start-analysis/${id}`,
          {
            method: "POST",
          }
        )

        if (!startResponse.ok) {
          throw new Error("启动分析失败")
        }

        console.log('分析任务已启动')
      } catch (error) {
        console.error('启动分析失败:', error)
        toast({
          title: "启动分析失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        })
      }
    }
  }

  const startNewAnalysis = async () => {
    if (!keyword.trim()) {
      toast({
        title: "请输入关键词",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    wsReadyRef.current = false
    
    try {
      updateAnalysisId(null)

      const response = await fetch(
        `http://localhost:8000/api/v1/keyword/analyze?keyword=${encodeURIComponent(keyword.trim())}`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "分析请求失败")
      }

      const data = await response.json() as AnalysisBrief
      console.log('分析任务状态:', data)

      if (data.status === "completed") {
        updateAnalysisId(data.id)
        toast({
          title: "分析完成",
          description: "已找到该关键词的历史分析结果",
        })
      } 
      else if (data.status === "failed") {
        toast({
          title: "分析失败",
          description: data.error_message || "未知错误",
          variant: "destructive",
        })
      }
      else {
        updateAnalysisId(data.id)
      }
    } catch (error) {
      console.error('创建分析任务失败:', error)
      toast({
        title: "创建分析任务失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
      updateAnalysisId(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex gap-4">
          <Input
            placeholder="请输入要分析的关键词"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isAnalyzing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isAnalyzing) {
                startNewAnalysis()
              }
            }}
          />
          <Button onClick={startNewAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? "分析中..." : "开始分析"}
          </Button>
        </div>
      </Card>

      {analysisId && (
        <>
          <AnalysisProgress 
            analysisId={analysisId} 
            onWsReady={() => handleWsReady(analysisId)}
          />
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="cooccurrence">共现词</TabsTrigger>
              <TabsTrigger value="volume">搜索量</TabsTrigger>
              <TabsTrigger value="competitors">竞争词</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <AnalysisResults analysisId={analysisId} type="overview" />
            </TabsContent>
            <TabsContent value="cooccurrence">
              <AnalysisResults analysisId={analysisId} type="cooccurrence" />
            </TabsContent>
            <TabsContent value="volume">
              <AnalysisResults analysisId={analysisId} type="volume" />
            </TabsContent>
            <TabsContent value="competitors">
              <AnalysisResults analysisId={analysisId} type="competitors" />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
} 