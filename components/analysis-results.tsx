"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { 
  AnalysisData, 
  AnalysisDetail,
  Cooccurrence, 
  SearchVolume, 
  Competitor 
} from "@/types/analysis"

interface AnalysisResultsProps {
  analysisId: number
  type: "overview" | "cooccurrence" | "volume" | "competitors"
  key?: number
}

export function AnalysisResults({ analysisId, type, key }: AnalysisResultsProps) {
  const [data, setData] = useState<AnalysisData | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`开始获取${type}数据, analysisId=${analysisId}${key ? `, key=${key}` : ''}`)
        let endpoint = `http://localhost:8000/api/v1/keyword/`
        switch (type) {
          case "overview":
            endpoint += `analysis/${analysisId}`
            break
          case "cooccurrence":
            endpoint += `cooccurrence/${analysisId}`
            break
          case "volume":
            endpoint += `search-volume/${analysisId}`
            break
          case "competitors":
            endpoint += `competitors/${analysisId}`
            break
        }

        const response = await fetch(endpoint)
        if (!response.ok) throw new Error("获取数据失败")
        const result = await response.json()
        console.log(`${type}数据获取成功:`, result)
        setData(result)
      } catch (error) {
        console.error(`${type}数据获取失败:`, error)
        toast({
          title: "数据加载失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [analysisId, type, toast, key])

  if (!data) return <div>加载中...</div>

  const renderTableHeader = () => {
    switch (type) {
      case "overview":
        return (
          <TableRow>
            <TableHead>种子关键词</TableHead>
            <TableHead className="text-right">总搜索量</TableHead>
            <TableHead className="text-right">种子搜索量</TableHead>
            <TableHead className="text-right">搜索占比(%)</TableHead>
          </TableRow>
        )
      case "cooccurrence":
        return (
          <TableRow>
            <TableHead>共现关键词</TableHead>
            <TableHead className="text-right">共现次数</TableHead>
          </TableRow>
        )
      case "volume":
        return (
          <TableRow>
            <TableHead>中介关键词</TableHead>
            <TableHead className="text-right">共现搜索量</TableHead>
            <TableHead className="text-right">中介词总搜索量</TableHead>
            <TableHead className="text-right">共现比例(%)</TableHead>
            <TableHead className="text-right">权重</TableHead>
          </TableRow>
        )
      case "competitors":
        return (
          <TableRow>
            <TableHead>竞争关键词</TableHead>
            <TableHead>关联中介词</TableHead>
            <TableHead className="text-right">共现搜索量</TableHead>
            <TableHead className="text-right">基础竞争度</TableHead>
            <TableHead className="text-right">加权竞争度</TableHead>
          </TableRow>
        )
    }
  }

  const renderTableBody = () => {
    switch (type) {
      case "overview":
        const overviewData = data as AnalysisDetail
        return (
          <TableRow>
            <TableCell>{overviewData.seed_keyword}</TableCell>
            <TableCell className="text-right">{overviewData.total_search_volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{overviewData.seed_search_volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{overviewData.seed_search_ratio.toFixed(2)}%</TableCell>
          </TableRow>
        )
      case "cooccurrence":
        const cooccurrenceData = data as Cooccurrence[]
        return cooccurrenceData.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.keyword}</TableCell>
            <TableCell className="text-right">{item.cooccurrence_count.toLocaleString()}</TableCell>
          </TableRow>
        ))
      case "volume":
        const volumeData = data as SearchVolume[]
        return volumeData.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.mediator_keyword}</TableCell>
            <TableCell className="text-right">{item.cooccurrence_volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{item.mediator_total_volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{item.cooccurrence_ratio.toFixed(2)}%</TableCell>
            <TableCell className="text-right">{item.weight.toFixed(2)}</TableCell>
          </TableRow>
        ))
      case "competitors":
        const competitorData = data as Competitor[]
        return competitorData.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.competitor_keyword}</TableCell>
            <TableCell>{item.mediator_keywords}</TableCell>
            <TableCell className="text-right">{item.cooccurrence_volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{item.base_competition_score.toFixed(2)}</TableCell>
            <TableCell className="text-right">{item.weighted_competition_score.toFixed(2)}</TableCell>
          </TableRow>
        ))
    }
  }

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          {renderTableHeader()}
        </TableHeader>
        <TableBody>
          {renderTableBody()}
        </TableBody>
      </Table>
    </Card>
  )
} 