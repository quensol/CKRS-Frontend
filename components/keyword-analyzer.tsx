"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { AnalysisProgress } from "./analysis-progress"
import { AnalysisResults } from "./analysis-results"

export function KeywordAnalyzer() {
  const [keyword, setKeyword] = useState("")
  const [analysisId, setAnalysisId] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  const startAnalysis = async () => {
    if (!keyword.trim()) {
      toast({
        title: "请输入关键词",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch(`http://localhost:8000/api/v1/keyword/analyze?keyword=${encodeURIComponent(keyword.trim())}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "分析请求失败")
      }

      const data = await response.json()
      setAnalysisId(data.id)

      if (data.status === "completed") {
        toast({
          title: "分析完成",
          description: "已找到该关键词的历史分析结果",
        })
      }
    } catch (error) {
      toast({
        title: "分析启动失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
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
          />
          <Button onClick={startAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? "分析中..." : "开始分析"}
          </Button>
        </div>
      </Card>

      {analysisId && (
        <>
          <AnalysisProgress analysisId={analysisId} />
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