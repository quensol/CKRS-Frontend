"use client"

import { KeywordAnalyzer } from "@/components/keyword-analyzer"
import { WebSocketStatus } from "@/components/websocket-status"
import { useState } from "react"

export default function Home() {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null)

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-8">关键词分析工具</h1>
          <KeywordAnalyzer onAnalysisIdChange={setCurrentAnalysisId} />
        </div>
        <div className="w-64 sticky top-4">
          <WebSocketStatus analysisId={currentAnalysisId} />
        </div>
      </div>
    </main>
  )
}
