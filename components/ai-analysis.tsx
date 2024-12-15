"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface AIAnalysisProps {
  analysisId: number
}

interface AnalysisStatus {
  status: "processing" | "completed" | "error"
  message: string
  analysis_id: number
  insight?: string
}

export function AIAnalysis({ analysisId }: AIAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const { toast } = useToast()

  // 组件挂载时检查是否已有分析结果
  useEffect(() => {
    const checkExistingAnalysis = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/gpt-filter/integrated-analysis/${analysisId}/status`
        )
        if (!response.ok) throw new Error("获取状态失败")
        const data = await response.json()
        
        if (data.status === "completed" && data.insight) {
          setStatus(data)
        }
      } catch (error) {
        console.error('检查现有分析失败:', error)
      }
    }

    checkExistingAnalysis()
  }, [analysisId])

  // 轮询状态
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/gpt-filter/integrated-analysis/${analysisId}/status`
        )
        if (!response.ok) throw new Error("获取状态失败")
        const data = await response.json()
        setStatus(data)

        // 如果分析完成或出错，停止轮询
        if (data.status === "completed" || data.status === "error") {
          clearInterval(intervalId)
          setIsLoading(false)  // 确保加载状态被重置
          if (data.status === "error") {
            toast({
              title: "分析失败",
              description: data.message,
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error('获取状态失败:', error)
        clearInterval(intervalId)
        setIsLoading(false)
        toast({
          title: "获取状态失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        })
      }
    }

    if (isLoading) {
      checkStatus()
      intervalId = setInterval(checkStatus, 3000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [analysisId, isLoading, toast])

  const startAnalysis = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `http://localhost:8000/api/v1/gpt-filter/integrated-analysis/${analysisId}`,
        {
          method: "POST"
        }
      )

      if (!response.ok) throw new Error("启动分析失败")
      
      toast({
        title: "分析已启动",
        description: "正在进行大模型分析，请稍候...",
      })
    } catch (error) {
      console.error('启动分析失败:', error)
      toast({
        title: "启动分析失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Markdown处理函数
  const processMarkdown = (text: string) => {
    return text
      // 加粗
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 行内代码
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // 链接
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // 删除线
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
  }

  // 处理代码块
  const isCodeBlock = (line: string) => line.startsWith('```')
  const processCodeBlock = (lines: string[], startIndex: number) => {
    const codeLines = []
    let i = startIndex + 1
    while (i < lines.length && !lines[i].startsWith('```')) {
      codeLines.push(lines[i])
      i++
    }
    return {
      code: codeLines.join('\n'),
      endIndex: i
    }
  }

  // 处理列表项
  const processListItem = (line: string) => {
    // 计算缩进级别
    const indentLevel = line.match(/^\s*/)?.[0].length || 0
    const content = line.trim()
    
    if (content.startsWith('- ')) {
      return {
        type: 'list-item',
        content: content.slice(2),
        indent: indentLevel
      }
    }
    return null
  }

  return (
    <Card className="p-6">
      {!isLoading && !status?.insight ? (
        <div className="text-center">
          <p className="mb-4 text-gray-500">点击下方按钮开始大模型分析</p>
          <Button 
            onClick={startAnalysis}
            disabled={isLoading}
          >
            开始分析
          </Button>
        </div>
      ) : status?.status === "completed" ? (
        <article className="prose prose-slate max-w-none 
          prose-headings:font-semibold 
          prose-h1:text-2xl prose-h1:mb-6
          prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-4
          prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
          prose-h4:text-base 
          prose-p:text-gray-600 prose-p:my-1
          prose-li:text-gray-600 
          prose-strong:text-gray-800
          prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6
          prose-li:my-0.5"
        >
          <div className="whitespace-pre-wrap">
            {(() => {
              const lines = status.insight?.replace(/\\n/g, '\n').split('\n') || []
              const elements = []
              let currentList: JSX.Element[] = []
              let isInList = false
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                const listItem = processListItem(line)
                
                if (listItem) {
                  if (!isInList) {
                    isInList = true
                    currentList = []
                  }
                  currentList.push(
                    <li 
                      key={i}
                      className={`ml-${listItem.indent * 4}`}
                      dangerouslySetInnerHTML={{ 
                        __html: processMarkdown(listItem.content) 
                      }}
                    />
                  )
                } else {
                  if (isInList) {
                    elements.push(<ul key={`list-${i}`}>{currentList}</ul>)
                    isInList = false
                    currentList = []
                  }
                  
                  // 处理其他类型的内容
                  if (line.startsWith('# ')) {
                    elements.push(<h1 key={i}>{line.slice(2)}</h1>)
                  }
                  // 处理标题
                  else if (line.startsWith('## ')) {
                    elements.push(<h2 key={i}>{line.slice(3)}</h2>)
                  }
                  else if (line.startsWith('### ')) {
                    elements.push(<h3 key={i}>{line.slice(4)}</h3>)
                  }
                  else if (line.startsWith('#### ')) {
                    elements.push(<h4 key={i}>{line.slice(5)}</h4>)
                  }
                  // 处理引用
                  else if (line.startsWith('> ')) {
                    elements.push(
                      <blockquote key={i} 
                        dangerouslySetInnerHTML={{ 
                          __html: processMarkdown(line.slice(2)) 
                        }} 
                      />
                    )
                  }
                  // 处理空行
                  else if (line.trim() === '') {
                    elements.push(<br key={i} />)
                  }
                  // 处理普通段落
                  else {
                    elements.push(
                      <p key={i} 
                        dangerouslySetInnerHTML={{ 
                          __html: processMarkdown(line) 
                        }} 
                      />
                    )
                  }
                }
              }
              
              // 处理最后一个列表（如果有）
              if (isInList) {
                elements.push(<ul key="list-final">{currentList}</ul>)
              }
              
              return elements
            })()}
          </div>
        </article>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-gray-500">{status?.message || "正在分析中..."}</p>
        </div>
      )}
    </Card>
  )
} 