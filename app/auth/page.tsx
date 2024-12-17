"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

export default function AuthPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  // 登录表单状态
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  })

  // 注册表单状态
  const [registerForm, setRegisterForm] = useState({
    email: "",
    phone: "",
    password: "",
    confirm_password: ""
  })

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // 检查是否是管理员账号
    if (loginForm.email === "admin" && loginForm.password === "admin") {
      // 模拟管理员登录延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 设置管理员标志
      localStorage.setItem("isAdmin", "true")
      
      toast({
        title: "管理员登录成功",
        description: "正在跳转到管理后台...",
      })
      
      setTimeout(() => router.push("/admin"), 1500)
      setIsLoading(false)  // 记得重置loading状态
      return
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "登录失败")
      }

      // 保存完整的认证信息
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("token_type", data.token_type)
      localStorage.setItem("user_id", data.id.toString())
      localStorage.setItem("user_email", data.email)
      
      toast({
        title: "登录成功",
        description: "正在跳转到关键词分析页面...",
      })

      setTimeout(() => router.push("/keyword-analyzer"), 1500)

    } catch (error) {
      toast({
        title: "登录失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 添加表单验证
    if (registerForm.password !== registerForm.confirm_password) {
      toast({
        title: "注册失败",
        description: "两次输入的密码不一致",
        variant: "destructive",
      })
      return
    }

    if (registerForm.password.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(registerForm.password)) {
      toast({
        title: "注册失败",
        description: "密码必须至少8位，且包含数字和字母",
        variant: "destructive",
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(registerForm.phone)) {
      toast({
        title: "注册失败",
        description: "请输入有效的手机号码",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(registerForm),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(data.detail?.message || "邮箱或手机号已存在")
        }
        throw new Error(data.detail || "注册失败")
      }

      toast({
        title: "注册成功",
        description: "请使用���账号登录",
      })

      // 清空表单
      setRegisterForm({
        email: "",
        phone: "",
        password: "",
        confirm_password: ""
      })

      // 切换到登录标签
      const loginTab = document.querySelector('[data-tab="login"]') as HTMLElement
      if (loginTab) loginTab.click()

    } catch (error) {
      toast({
        title: "注册失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-4"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            洞察市场，驱动未来
          </h1>
          <p className="text-gray-500">
            专业的关键词分析工具，助您把握市场脉搏
          </p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-tab="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">邮箱/手机</label>
                  <Input
                    type="text"
                    placeholder="请输入邮箱或手机号"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">密码</label>
                  <Input
                    type="password"
                    placeholder="请输入密码"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "登录中..." : "登录"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">邮箱</label>
                  <Input
                    type="email"
                    placeholder="请输入邮箱"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">手机号码</label>
                  <Input
                    type="tel"
                    placeholder="请输入手机号码"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">密码</label>
                  <Input
                    type="password"
                    placeholder="请输入密码"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">确认密码</label>
                  <Input
                    type="password"
                    placeholder="请再次输入密码"
                    value={registerForm.confirm_password}
                    onChange={(e) => setRegisterForm(prev => ({
                      ...prev,
                      confirm_password: e.target.value
                    }))}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "注册中..." : "注册"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  )
} 