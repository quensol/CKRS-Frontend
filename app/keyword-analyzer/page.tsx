"use client"

import { KeywordAnalyzer } from "@/components/keyword-analyzer"
import { HistorySidebar } from "@/components/history-sidebar"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function KeywordAnalyzerPage() {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // 检查用户是否已登录
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.push("/auth")
    }
  }, [router])

  // 处理退出登录
  const handleLogout = () => {
    // 清除所有存储的认证信息
    localStorage.removeItem("access_token")
    localStorage.removeItem("token_type")
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_email")

    toast({
      title: "已退出登录",
      description: "正在返回登录页面...",
    })

    // 跳转到登录页面
    setTimeout(() => router.push("/auth"), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className="fixed left-4 top-4 z-50"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0">
          <HistorySidebar onSelectAnalysis={setCurrentAnalysisId} />
        </SheetContent>
      </Sheet>
      <Button
        variant="outline"
        size="icon"
        className="fixed right-4 top-4 z-50"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
      </Button>
      <main className="mx-auto max-w-7xl">
        <div className="py-8 px-4">
          <div className="ml-12">
            <h1 className="text-3xl font-bold mb-8">关键词分析工具</h1>
            <KeywordAnalyzer 
              onAnalysisIdChange={setCurrentAnalysisId}
              selectedAnalysisId={currentAnalysisId}
            />
          </div>
        </div>
      </main>
    </div>
  )
} 