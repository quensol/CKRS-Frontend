"use client"

import { KeywordAnalyzer } from "@/components/keyword-analyzer"
import { useState } from "react"

export default function Home() {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">关键词分析工具</h1>
        <KeywordAnalyzer onAnalysisIdChange={setCurrentAnalysisId} />
      </div>
    </main>
  )
}
