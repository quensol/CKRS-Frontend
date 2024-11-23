"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { AnalysisProgress } from "./analysis-progress"
import { AnalysisResults } from "./analysis-results"
import { WebSocketStatus } from "./websocket-status"
import { AnalysisBrief } from "@/types/analysis"

interface KeywordAnalyzerProps {
  onAnalysisIdChange?: (id: number | null) => void
}

export function KeywordAnalyzer({ onAnalysisIdChange }: KeywordAnalyzerProps) {
  const [keyword, setKeyword] = useState("")
  const [analysisId, setAnalysisId] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [resultKey, setResultKey] = useState(0)
  const { toast } = useToast()
  const wsReadyRef = useRef(false)
  const analysisStatusRef = useRef<string>("pending")
  const completedRef = useRef(false)

  const updateAnalysisId = (id: number | null) => {
    setAnalysisId(id)
    onAnalysisIdChange?.(id)
  }

  const handleWsReady = async (id: number) => {
    wsReadyRef.current = true
    console.log('WebSocket已就绪，准备启动分析...')
    
    if (id && wsReadyRef.current && analysisStatusRef.current === "pending") {
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

        console.log('分任务已启动')
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
    completedRef.current = false
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

      analysisStatusRef.current = data.status
      updateAnalysisId(data.id)

      if (data.status === "completed") {
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

  const handleAnalysisComplete = () => {
    if (completedRef.current) {
      console.log('已经处理过完成回调，跳过')
      return
    }
    
    console.log('收到分析完成通知，等待数据写入...')
    completedRef.current = true
    
    // 添加1秒延迟，等待数据库写入完成
    setTimeout(() => {
      console.log('开始更新resultKey触发重新获取数据')
      setResultKey(prev => {
        const newKey = prev + 1
        console.log(`resultKey更新: ${prev} -> ${newKey}`)
        return newKey
      })
    }, 1000)  // 延迟1秒
  }

  return (
    <div className="space-y-8">
      <Card className="p-6 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">关键词分析</h2>
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
              className="flex-1"
            />
            <Button 
              onClick={startNewAnalysis} 
              disabled={isAnalyzing}
              className="min-w-[100px]"
            >
              {isAnalyzing ? "分析中..." : "开始分析"}
            </Button>
          </div>
        </div>
      </Card>

      {analysisId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <AnalysisProgress 
                analysisId={analysisId} 
                onWsReady={() => handleWsReady(analysisId)}
                onComplete={handleAnalysisComplete}
              />
            </div>
            <div className="md:col-span-1">
              <WebSocketStatus analysisId={analysisId} />
            </div>
          </div>

          <Card className="p-6 shadow-md">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="cooccurrence">共现词</TabsTrigger>
                <TabsTrigger value="volume">搜索量</TabsTrigger>
                <TabsTrigger value="competitors">竞争词</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <AnalysisResults 
                  key={resultKey}
                  analysisId={analysisId} 
                  type="overview" 
                />
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
          </Card>
        </>
      )}
    </div>
  )
} 