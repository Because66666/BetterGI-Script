"use client"

import {
  ArrowLeft,
  Calendar,
  Tag,
  User,
  Users,
  ExternalLink,
  YoutubeIcon as Subscribe,
  Check,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from "react-markdown"
import { dataService } from "@/services/dataService"
import type { DataItem, GroupedDataItem } from "@/types"
import { useState } from "react"

interface DetailPanelProps {
  selectedItem: DataItem | GroupedDataItem | null
  onBack: () => void
}

export function DetailPanel({ selectedItem, onBack }: DetailPanelProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "success" | "error">("idle")

  // 解析名称和路径
  const parseNameAndPath = (name: string) => {
    const match = name.match(/^(.+?)【(.+)】$/)
    if (match) {
      return {
        displayName: match[1],
        pathInfo: match[2],
      }
    }
    return {
      displayName: name,
      pathInfo: null,
    }
  }

  // 判断是否为分组项目
  const isGroupedItem = (item: DataItem | GroupedDataItem): item is GroupedDataItem => {
    return "items" in item && "count" in item
  }

  // 处理订阅按钮点击
  const handleSubscribe = async () => {
    if (!selectedItem?.subscriptionString) {
      setCopyStatus("error")
      setTimeout(() => setCopyStatus("idle"), 2000)
      return
    }

    setCopyStatus("copying")

    try {
      const success = await dataService.copyToClipboard(selectedItem.subscriptionString)
      if (success) {
        setCopyStatus("success")
        setTimeout(() => setCopyStatus("idle"), 2000)
      } else {
        setCopyStatus("error")
        setTimeout(() => setCopyStatus("idle"), 2000)
      }
    } catch (error) {
      console.error("复制失败:", error)
      setCopyStatus("error")
      setTimeout(() => setCopyStatus("idle"), 2000)
    }
  }

  // 获取订阅按钮的显示内容
  const getSubscribeButtonContent = () => {
    switch (copyStatus) {
      case "copying":
        return (
          <>
            <Copy className="w-4 h-4 mr-2 animate-spin" />
            复制中...
          </>
        )
      case "success":
        return (
          <>
            <Check className="w-4 h-4 mr-2" />
            已复制
          </>
        )
      case "error":
        return (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            复制失败
          </>
        )
      default:
        return (
          <>
            <Subscribe className="w-4 h-4 mr-2" />
            订阅
          </>
        )
    }
  }

  // 获取订阅按钮的样式
  const getSubscribeButtonStyle = () => {
    switch (copyStatus) {
      case "success":
        return "bg-green-500 hover:bg-green-600"
      case "error":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-blue-500 hover:bg-blue-600"
    }
  }

  if (!selectedItem) return null

  return (
    <div className="fixed top-0 right-0 w-2/3 h-full bg-white transition-all duration-700 ease-out transform translate-x-0 opacity-100">
      <div className="h-full flex flex-col">
        {/* 顶部返回按钮 */}
        <div className="p-6 border-b border-gray-100">
          <Button
            onClick={onBack}
            variant="ghost"
            className="hover:bg-gray-50 transition-all duration-200 rounded-lg px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回搜索
          </Button>
        </div>

        {/* 详情内容 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div
            className="max-w-2xl mx-auto transform transition-all duration-500 ease-out opacity-0 animate-fade-in"
            style={{ transitionDelay: "200ms", animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            {isGroupedItem(selectedItem) ? (
              // 分组项目显示（聚合后的地图追踪数据）
              <div className="bg-white space-y-6">
                {/* 聚合标题 */}
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{selectedItem.name}</h1>
                  <div className="text-sm text-gray-600 mb-4">共 {selectedItem.count} 个项目</div>
                  <div className="h-px bg-gray-200"></div>
                </div>

                {/* 聚合的元信息 */}
                <div className="space-y-4">
                  {/* 聚合的作者信息 */}
                  {selectedItem.authors && selectedItem.authors.length > 0 && (
                    <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedItem.authors.map((author, index) => (
                            <span key={index} className="flex items-center gap-1">
                              {author.link ? (
                                <a
                                  href={author.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                                >
                                  {author.name}
                                  <ExternalLink className="w-2 h-2" />
                                </a>
                              ) : (
                                <span>{author.name}</span>
                              )}
                              {index < selectedItem.authors!.length - 1 && <span className="text-gray-400">,</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 聚合的更新时间 */}
                  {selectedItem.lastUpdated && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{dataService.formatDate(selectedItem.lastUpdated)}</span>
                    </div>
                  )}

                  {/* 聚合的标签 */}
                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-gray-400" />
                      {selectedItem.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          className="bg-blue-50 text-blue-600 border-0 rounded-md px-2 py-1 text-xs font-medium hover:bg-blue-100 transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* 聚合的描述（原数据元素名称列表） */}
                {selectedItem.description && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">包含的数据项目：</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {selectedItem.description}
                      </div>
                    </div>
                  </div>
                )}

                {/* 详细项目列表（可选，用于调试） */}
                {/* <div className="mt-6 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">详细信息：</h3>
                  <div className="space-y-3">
                    {selectedItem.items.slice(0, 3).map((item, index) => {
                      const { displayName } = parseNameAndPath(item.name)
                      return (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-900">{displayName}</div>
                          {item.description && (
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {item.description.replace(/[#*`]/g, "")}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {selectedItem.items.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        还有 {selectedItem.items.length - 3} 个项目...
                      </div>
                    )}
                  </div>
                </div> */}
              </div>
            ) : (
              // 单个项目显示
              <div className="bg-white">
                {/* 标题区 */}
                <div className="mb-6">
                  {(() => {
                    const { displayName } = parseNameAndPath(selectedItem.name)
                    return (
                      <div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{displayName}</h1>
                      </div>
                    )
                  })()}

                  <div className="h-px bg-gray-200"></div>
                </div>

                <div className="space-y-4">
                  {/* 元信息行 */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                    {/* 单个作者 */}
                    {selectedItem.author && (
                      <>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span>{selectedItem.author}</span>
                        </div>
                        <span className="text-gray-400">·</span>
                      </>
                    )}

                    {/* 多个作者 */}
                    {selectedItem.authors && selectedItem.authors.length > 0 && (
                      <>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <div className="flex items-center gap-2 flex-wrap">
                            {selectedItem.authors.map((author, index) => (
                              <span key={index} className="flex items-center gap-1">
                                {author.link ? (
                                  <a
                                    href={author.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                                  >
                                    {author.name}
                                    <ExternalLink className="w-2 h-2" />
                                  </a>
                                ) : (
                                  <span>{author.name}</span>
                                )}
                                {index < selectedItem.authors!.length - 1 && <span className="text-gray-400">,</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-gray-400">·</span>
                      </>
                    )}

                    {/* 更新时间 */}
                    {selectedItem.lastUpdated && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{dataService.formatDate(selectedItem.lastUpdated)}</span>
                      </div>
                    )}
                  </div>

                  {/* 标签区 */}
                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-gray-400" />
                      {selectedItem.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          className="bg-blue-50 text-blue-600 border-0 rounded-md px-2 py-1 text-xs font-medium hover:bg-blue-100 transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 描述内容 */}
                  {selectedItem.description && (
                    <div className="mt-4 pt-4">
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-gray-800 prose-pre:bg-gray-50 prose-pre:text-gray-800 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                        <ReactMarkdown>{selectedItem.description}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 订阅按钮 */}
      <Button
        onClick={handleSubscribe}
        disabled={!selectedItem?.subscriptionString || copyStatus === "copying"}
        className={`fixed bottom-8 right-8 text-white active:scale-98 border-0 rounded-md px-4 py-2 font-medium transition-all duration-300 transform shadow-lg hover:shadow-xl translate-y-0 opacity-100 scale-100 ${getSubscribeButtonStyle()}`}
      >
        {getSubscribeButtonContent()}
      </Button>
    </div>
  )
}
