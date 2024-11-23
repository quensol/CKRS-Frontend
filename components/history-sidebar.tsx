"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { AnalysisBrief } from "@/types/analysis"

interface HistorySidebarProps {
  onSelectAnalysis: (analysisId: number) => void
}

export function HistorySidebar({ onSelectAnalysis }: HistorySidebarProps) {
  const [history, setHistory] = useState<AnalysisBrief[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const params = new URLSearchParams({
          limit: '1000',
          skip: '0'
        })
        if (searchKeyword) {
          params.append('keyword', searchKeyword)
        }
        const response = await fetch(`http://localhost:8000/api/v1/keyword/history?${params}`)
        if (!response.ok) throw new Error("获取历史记录失败")
        const data = await response.json()
        
        const sortedData = [...data].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        setHistory(sortedData)
      } catch (error) {
        console.error('获取历史记录失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [searchKeyword])

  return (
    <div className="h-full flex flex-col">
      {/* 固定在顶部的搜索区域 */}
      <div className="p-4 border-b bg-white">
        <h3 className="font-medium mb-3">历史记录</h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索关键词..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* 可滚动的历史记录列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {loading ? (
            // 加载状态
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="mb-2">
                <div className="h-10 bg-gray-100 animate-pulse rounded" />
              </div>
            ))
          ) : history.length > 0 ? (
            // 历史记录列表
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectAnalysis(item.id)}
                className="w-full p-3 text-left rounded-md hover:bg-gray-100 transition-colors mb-2"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{item.seed_keyword}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs mt-1">
                  {item.status === "completed" ? (
                    <span className="text-green-500">已完成</span>
                  ) : item.status === "failed" ? (
                    <span className="text-red-500">失败</span>
                  ) : (
                    <span className="text-yellow-500">处理中</span>
                  )}
                </div>
              </button>
            ))
          ) : (
            // 空状态
            <div className="p-4 text-center text-muted-foreground">
              暂无历史记录
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 