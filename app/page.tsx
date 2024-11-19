import { KeywordAnalyzer } from "@/components/keyword-analyzer"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">关键词分析工具</h1>
      <KeywordAnalyzer />
    </main>
  )
}
