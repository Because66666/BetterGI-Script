"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { LoadingState } from "@/types"

interface LoadingScreenProps {
  loadingState: LoadingState
  onRetry: () => void
}

export function LoadingScreen({ loadingState, onRetry }: LoadingScreenProps) {
  const { progress, currentSource, error } = loadingState

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      {/* Logo和标题 */}
      <div className="flex items-center gap-3 mb-12">
        <img
          src="https://bgi.sh/favicon.ico"
          alt="BetterGI Logo"
          className="w-12 h-12"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
        <h1 className="text-2xl font-bold text-gray-900">BetterGI脚本仓库</h1>
      </div>

      {/* 加载动画 */}
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>

        {/* 进度条 */}
        <div className="space-y-3">
          <Progress value={progress} className="w-full h-2" />
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600">正在从 {currentSource} 获取数据...</p>
            <p className="text-xs text-gray-400">{Math.round(progress)}%</p>
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="text-center space-y-4">
            <p className="text-sm text-red-600">{error}</p>
            <Button onClick={onRetry} className="bg-blue-500 hover:bg-blue-600 text-white">
              重试
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
