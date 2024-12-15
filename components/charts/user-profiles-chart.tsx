"use client"

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { UserProfile, UserProfileStats } from '@/types/analysis'
import { useToast } from "@/hooks/use-toast"

interface UserProfilesChartProps {
  data: UserProfile[]
  analysisId: number
}

const AGE_LABELS = {
  0: "未知年龄",
  1: "0-18岁",
  2: "19-23岁",
  3: "24-30岁",
  4: "31-40岁",
  5: "41-50岁",
  6: "51岁以上"
}

const GENDER_LABELS = {
  0: "未知",
  1: "男性",
  2: "女性"
}

const EDUCATION_LABELS = {
  0: "未知学历",
  1: "博士",
  2: "硕士",
  3: "大学生",
  4: "高中",
  5: "初中",
  6: "小学"
}

const COLORS = [
  'rgb(236, 165, 153)', // 柔和的粉红色
  'rgb(250, 199, 149)', // 柔和的橙色
  'rgb(255, 233, 190)', // 柔和的黄色
  'rgb(227, 237, 224)', // 柔和的绿色
  'rgb(171, 211, 225)', // 柔和的蓝色
  'rgb(146, 180, 200)', // 柔和的深蓝色
  'rgb(200, 200, 200)'  // 额外的灰色，以防需要
]

export function UserProfilesChart({ data, analysisId }: UserProfilesChartProps) {
  const [stats, setStats] = useState<UserProfileStats | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/keyword/analysis/${analysisId}/user-profiles/stats`
        )
        if (!response.ok) throw new Error("获取统计数据失败")
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('获取统计数据失败:', error)
        toast({
          title: "获取统计数据失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        })
      }
    }

    fetchStats()
  }, [analysisId, toast])

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>暂无用户画像数据</p>
      </div>
    )
  }

  const ageData = data
    .filter(item => item.profile_type === "age")
    .map(item => ({
      name: AGE_LABELS[item.category_value as keyof typeof AGE_LABELS],
      value: item.percentage
    }))

  const genderData = data
    .filter(item => item.profile_type === "gender")
    .map(item => ({
      name: GENDER_LABELS[item.category_value as keyof typeof GENDER_LABELS],
      value: item.percentage
    }))

  const educationData = data
    .filter(item => item.profile_type === "education")
    .map(item => ({
      name: EDUCATION_LABELS[item.category_value as keyof typeof EDUCATION_LABELS],
      value: item.percentage
    }))

  const renderPieChart = (data: any[], title: string) => (
    <div className="h-[320px] pb-16">
      <h3 className="text-center font-medium mb-6">{title}</h3>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={45}
            paddingAngle={2}
            label={({name, percent}) => (
              `${name} ${(percent * 100).toFixed(1)}%`
            )}
            labelLine={{ 
              strokeWidth: 1,
              stroke: 'rgb(146, 180, 200)',  // 使用深蓝色作为线条颜色
              length: 15
            }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                strokeWidth={1}
                stroke="white"  // 使用白色边框使颜色更突出
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `${value.toFixed(1)}%`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgb(227, 237, 224)',  // 使用柔和的绿色作为边框
              borderRadius: '6px',
              padding: '8px 12px'
            }}
          />
          <Legend 
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: 'rgb(146, 180, 200)' }}>{value}</span>  // 使用深蓝色作为文字颜色
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <div className="pb-4">
      <div className="mb-6 p-4 bg-[rgb(247,250,252)] rounded-lg text-sm">
        <h4 className="font-medium mb-3">用户画像分析</h4>
        <p className="text-[rgb(146,180,200)] mb-4">展示了目标用户群体的年龄、性别和教育程度分布情况</p>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-[rgb(227,237,224)]">
            <div>
              <p className="text-[rgb(146,180,200)]">总用户数</p>
              <p className="font-medium mt-1">{stats.total_users.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[rgb(146,180,200)]">平均年龄段</p>
              <p className="font-medium mt-1">
                {stats.avg_age < 1 ? "未知" :
                 stats.avg_age < 2 ? "0-18岁" :
                 stats.avg_age < 3 ? "19-23岁" :
                 stats.avg_age < 4 ? "24-30岁" :
                 stats.avg_age < 5 ? "31-40岁" :
                 stats.avg_age < 6 ? "41-50岁" : "51岁以上"}
              </p>
            </div>
            <div>
              <p className="text-[rgb(146,180,200)]">性别比例</p>
              <p className="font-medium mt-1">
                男 {stats.male_ratio.toFixed(1)}% : 女 {stats.female_ratio.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[rgb(146,180,200)]">平均教育程度</p>
              <p className="font-medium mt-1">
                {stats.avg_education < 1 ? "未知" :
                 stats.avg_education < 2 ? "博士" :
                 stats.avg_education < 3 ? "硕士" :
                 stats.avg_education < 4 ? "大学" :
                 stats.avg_education < 5 ? "高中" :
                 stats.avg_education < 6 ? "初中" : "小学"}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {renderPieChart(ageData, "年龄分布")}
        {renderPieChart(genderData, "性别分布")}
        {renderPieChart(educationData, "教育程度分布")}
      </div>
    </div>
  )
} 