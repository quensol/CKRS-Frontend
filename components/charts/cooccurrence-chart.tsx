"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Cooccurrence } from '@/types/analysis'

interface CooccurrenceChartProps {
  data: Cooccurrence[]
}

export function CooccurrenceChart({ data }: CooccurrenceChartProps) {
  // 按共现次数排序，取前15个
  const chartData = [...data]
    .sort((a, b) => b.cooccurrence_count - a.cooccurrence_count)
    .slice(0, 15)
    .map(item => ({
      name: item.keyword,
      value: item.cooccurrence_count
    }))

  return (
    <div>
      <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
        <h4 className="font-medium">数据说明：</h4>
        <p>• 展示共现次数最多的前15个关键词</p>
        <p>• 共现次数表示该关键词在查询中与种子关键词一起出现的次数</p>
        <p>• 这些关键词将用于后续的搜索量分析和竞争词发现</p>
      </div>
      <div className="w-full h-[400px]">
        <ResponsiveContainer>
          <BarChart
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
              label={{ 
                value: '共现次数', 
                angle: -90, 
                position: 'insideLeft',
                offset: 10
              }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium mb-2">关键词: {label}</p>
                    <p className="text-sm">
                      共现次数: {payload[0].value.toLocaleString()}
                    </p>
                  </div>
                )
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar 
              dataKey="value" 
              fill="#8884d8" 
              name="共现次数"
              fillOpacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 