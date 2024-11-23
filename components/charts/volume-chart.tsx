"use client"

import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ZAxis
} from 'recharts'
import { SearchVolume } from '@/types/analysis'

interface VolumeChartProps {
  data: SearchVolume[]
}

export function VolumeChart({ data }: VolumeChartProps) {
  const chartData = data.map(item => ({
    name: item.mediator_keyword,
    x: item.cooccurrence_ratio,
    y: item.weight,
    z: item.cooccurrence_volume,
    totalVolume: item.mediator_total_volume
  }))

  return (
    <div>
      <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
        <h4 className="font-medium">计算公式说明：</h4>
        <p>• 共现比例 = (共现搜索量/中介词总搜索量) * 100%</p>
        <p>• 权重 = (共现搜索量/种子关键词搜索量) * 100%</p>
        <p>• 气泡大小表示共现搜索量的相对大小</p>
      </div>
      <div className="w-full h-[400px]">
        <ResponsiveContainer>
          <ScatterChart
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="共现比例" 
              unit="%" 
              label={{ 
                value: '共现比例 (%)', 
                position: 'bottom',
                offset: 0
              }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="权重" 
              unit="%" 
              label={{ 
                value: '权重 (%)', 
                angle: -90,
                position: 'left',
                offset: 0
              }}
            />
            <ZAxis 
              type="number" 
              dataKey="z" 
              range={[30, 300]} 
              name="共现搜索量" 
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium mb-2">{data.name}</p>
                    <div className="space-y-1 text-sm">
                      <p>共现比例: {data.x.toFixed(2)}%</p>
                      <p>权重: {data.y.toFixed(2)}%</p>
                      <p>共现搜索量: {data.z.toLocaleString()}</p>
                      <p>总搜索量: {data.totalVolume.toLocaleString()}</p>
                    </div>
                  </div>
                )
              }}
            />
            <Scatter 
              data={chartData} 
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 