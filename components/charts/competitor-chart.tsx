"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Competitor } from '@/types/analysis'

interface CompetitorChartProps {
  data: Competitor[]
}

export function CompetitorChart({ data }: CompetitorChartProps) {
  // 按加权竞争度排序，取前10个
  const chartData = [...data]
    .sort((a, b) => b.weighted_competition_score - a.weighted_competition_score)
    .slice(0, 10)
    .map(item => ({
      name: item.competitor_keyword,
      base: item.base_competition_score,
      weighted: item.weighted_competition_score,
      volume: item.cooccurrence_volume,
      mediators: item.mediator_keywords
    }))

  return (
    <div>
      <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
        <h4 className="font-medium">计算公式说明：</h4>
        <p>• 基础竞争度 = 竞争词与中介词的共现量 / (中介词总量 - 种子词与中介词共现量)</p>
        <p>• 加权竞争度 = 基础竞争度 * 中介词权重</p>
        <p>• 柱状图表示共现搜索量，折线图表示竞争度指标</p>
      </div>
      <div className="w-full h-[400px]">
        <ResponsiveContainer>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 30, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}  // 显示所有标签
            />
            <YAxis 
              yAxisId="left"
              label={{ value: '竞争度 (%)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              label={{ value: '共现搜索量', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium mb-2">{data.name}</p>
                    <div className="space-y-1 text-sm">
                      <p>基础竞争度: {data.base.toFixed(2)}%</p>
                      <p>加权竞争度: {data.weighted.toFixed(2)}%</p>
                      <p>共现搜索量: {data.volume.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-2">关联中介词: {data.mediators}</p>
                    </div>
                  </div>
                )
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar 
              yAxisId="right"
              dataKey="volume" 
              fill="#82ca9d" 
              name="共现搜索量"
              fillOpacity={0.8}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="base"
              stroke="#8884d8"
              name="基础竞争度"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="weighted"
              stroke="#ff7300"
              name="加权竞争度"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 