"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Upload, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

interface DataFile {
  id: number
  name: string
  size: string
  enabled: boolean
}

interface DictFile extends DataFile {} // 分词词库文件接口

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [dataFiles, setDataFiles] = useState<DataFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [dictFiles, setDictFiles] = useState<DictFile[]>([])
  const [isApplyingDict, setIsApplyingDict] = useState(false)
  const dictFileInputRef = useRef<HTMLInputElement>(null)

  // 检查是否是管理员
  useEffect(() => {
    const checkAdmin = () => {
      const isAdmin = localStorage.getItem("isAdmin") === "true"
      if (!isAdmin) {
        toast({
          title: "访问被拒绝",
          description: "您没有管理员权限",
          variant: "destructive",
        })
        router.push("/auth")
      }
    }
    checkAdmin()
  }, [router, toast])

  // 从本地存储加载数据
  useEffect(() => {
    const savedFiles = localStorage.getItem("dataFiles")
    if (savedFiles) {
      setDataFiles(JSON.parse(savedFiles))
    }
  }, [])

  // 从本地存储加载词库数据
  useEffect(() => {
    const savedDictFiles = localStorage.getItem("dictFiles")
    if (savedDictFiles) {
      setDictFiles(JSON.parse(savedDictFiles))
    }
  }, [])

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 转换文件大小为可读格式
      const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }

      // 添加新文件到列表
      const newFiles = [...dataFiles, {
        id: Date.now(),
        name: file.name,
        size: formatFileSize(file.size),
        enabled: true
      }]
      setDataFiles(newFiles)
      localStorage.setItem("dataFiles", JSON.stringify(newFiles))

      // 清空文件输入以允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 处理启用状态变更
  const handleEnableChange = (id: number) => {
    const updatedFiles = dataFiles.map(file => 
      file.id === id ? { ...file, enabled: !file.enabled } : file
    )
    setDataFiles(updatedFiles)
    localStorage.setItem("dataFiles", JSON.stringify(updatedFiles))
  }

  // 处理应用更改
  const handleApply = async () => {
    setIsApplying(true)
    
    // 模拟处理过程
    await new Promise(resolve => setTimeout(resolve, 500))
    
    toast({
      title: "更改已应用",
      description: "数据文件配置已更新",
    })
    
    setIsApplying(false)
  }

  // 处理词库文件选择
  const handleDictFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.name.endsWith('.txt')) {
        toast({
          title: "文件类型错误",
          description: "请选择 .txt 格式的文件",
          variant: "destructive",
        })
        return
      }

      const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }

      const newFiles = [...dictFiles, {
        id: Date.now(),
        name: file.name,
        size: formatFileSize(file.size),
        enabled: true
      }]
      setDictFiles(newFiles)
      localStorage.setItem("dictFiles", JSON.stringify(newFiles))

      if (dictFileInputRef.current) {
        dictFileInputRef.current.value = ''
      }
    }
  }

  // 处理词库启用状态变更
  const handleDictEnableChange = (id: number) => {
    const updatedFiles = dictFiles.map(file => 
      file.id === id ? { ...file, enabled: !file.enabled } : file
    )
    setDictFiles(updatedFiles)
    localStorage.setItem("dictFiles", JSON.stringify(updatedFiles))
  }

  // 处理词库应用更改
  const handleDictApply = async () => {
    setIsApplyingDict(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    toast({
      title: "更改已应用",
      description: "分词词库配置已更新",
    })
    
    setIsApplyingDict(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("isAdmin")
    toast({
      title: "已退出登录",
      description: "正在返回登录页面...",
    })
    setTimeout(() => router.push("/auth"), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 退出登录按钮 */}
      <Button
        variant="outline"
        size="icon"
        className="fixed right-4 top-4 z-50"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
      </Button>

      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">欢迎管理员</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">管理数据文件</h2>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".csv,.txt,.json"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                浏览文件
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>数据文件名</TableHead>
                <TableHead>数据文件大小</TableHead>
                <TableHead className="text-center">是否启用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={file.enabled}
                      onCheckedChange={() => handleEnableChange(file.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {dataFiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                    暂无数据文件
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* 添加应用按钮 */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleApply}
              disabled={isApplying || dataFiles.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isApplying ? "正在应用..." : "应用更改"}
            </Button>
          </div>
        </div>

        {/* 分词词库列表 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">管理分词词库</h2>
            <div>
              <input
                type="file"
                ref={dictFileInputRef}
                onChange={handleDictFileSelect}
                className="hidden"
                accept=".txt"
              />
              <Button
                onClick={() => dictFileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                浏览词库
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>词库文件名</TableHead>
                <TableHead>文件大小</TableHead>
                <TableHead className="text-center">是否启用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dictFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={file.enabled}
                      onCheckedChange={() => handleDictEnableChange(file.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {dictFiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                    暂无词库文件
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleDictApply}
              disabled={isApplyingDict || dictFiles.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isApplyingDict ? "正在应用..." : "应用更改"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
} 