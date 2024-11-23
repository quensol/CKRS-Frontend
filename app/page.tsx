"use client"

import { KeywordAnalyzer } from "@/components/keyword-analyzer"
import { HistorySidebar } from "@/components/history-sidebar"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function Home() {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null)

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
