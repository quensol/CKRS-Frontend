"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AnalysisDetail } from '@/types/analysis'

interface OverviewChartProps {
  data: AnalysisDetail
}

export function OverviewChart({ data }: OverviewChartProps) {
  const chartData = [
    {
      name: '共现词数量',
      value: data.cooccurrence_keywords?.length || 0,
      description: '与种子关键词共同出现的关键词数量',
      color: '#8884d8'
    },
    {
      name: '中介词数量',
      value: data.search_volumes?.length || 0,
      description: '筛选后用于分析的中介关键词数量',
      color: '#82ca9d'
    },
    {
      name: '竞争词数量',
      value: data.competitors?.length || 0,
      description: '发现的潜在竞争关键词数量',
      color: '#ffc658'
    }
  ]

  return (
    <div>
      <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
        <h4 className="font-medium mb-2">分析概览：{data.seed_keyword}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p>• 总搜索量：{data.total_search_volume.toLocaleString()}</p>
            <p>• 种子关键词搜索量：{data.seed_search_volume.toLocaleString()}</p>
          </div>
          <div>
            <p>• 分析状态：{data.status}</p>
            <p>• 分析时间：{new Date(data.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
            barSize={60}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name"
              interval={0}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              label={{ 
                value: '数量', 
                angle: -90, 
                position: 'insideLeft',
                offset: 10
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium mb-2">{data.name}</p>
                    <div className="space-y-1 text-sm">
                      <p>数量: {data.value.toLocaleString()}</p>
                      <p className="text-gray-500 text-xs">{data.description}</p>
                    </div>
                  </div>
                )
              }}
            />
            <Bar 
              dataKey="value" 
              name="数量"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 