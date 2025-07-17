"use client"

import { useState, useEffect, useMemo } from "react"
import {
  ChevronDown,
  Calendar,
  Tag,
  User,
  Users,
  YoutubeIcon as Subscribe,
  ArrowLeft,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from "react-markdown"

interface Author {
  name: string
  link?: string
}

interface DataItem {
  name: string
  author?: string
  authors?: Author[]
  description?: string
  tags?: string[]
  lastUpdated?: string
}

interface IndexData {
  name: string
  children: DataItem[]
}

interface RepoData {
  indexes: IndexData[]
}

const categoryMap = {
  全部: "all",
  地图追踪: "pathing",
  JS脚本: "js",
  战斗策略: "combat",
  七圣召唤: "tcg",
}

export default function Component() {
  const [data, setData] = useState<RepoData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [searchText, setSearchText] = useState("")
  const [selectedItem, setSelectedItem] = useState<DataItem | null>(null)

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/babalae/bettergi-scripts-list/refs/heads/main/repo.json")
      .then((res) => res.json())
      .then((data: RepoData) => setData(data))
      .catch((err) => console.error("Failed to fetch data:", err))
  }, [])

  const filteredItems = useMemo(() => {
    if (!data) return []

    let items: DataItem[] = []

    if (selectedCategory === "全部") {
      items = data.indexes.flatMap((index) => index.children)
    } else {
      const categoryKey = categoryMap[selectedCategory as keyof typeof categoryMap]
      const targetIndex = data.indexes.find((index) => index.name === categoryKey)
      items = targetIndex?.children || []
    }

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase()
      items = items.filter((item) => {
        // 搜索名称
        const nameMatch = item.name.toLowerCase().includes(searchLower)

        // 搜索标签
        const tagMatch = item.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) || false

        // 搜索描述
        const descMatch = item.description?.toLowerCase().includes(searchLower) || false

        return nameMatch || tagMatch || descMatch
      })
    }

    return items.slice(0, 5)
  }, [data, selectedCategory, searchText])

  const handleItemClick = (item: DataItem) => {
    setSelectedItem(item)
  }

  const handleBack = () => {
    setSelectedItem(null)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return `更新于 ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
    } catch {
      return `更新于 ${dateString}`
    }
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans relative overflow-hidden">
      {/* Logo和标题 - 左上角 */}
      <div
        className={`fixed top-6 left-6 flex items-center gap-3 z-10 transition-all duration-700 ease-out ${
          selectedItem ? "opacity-100" : "opacity-100"
        }`}
      >
        <img
          src="https://bgi.sh/favicon.ico"
          alt="BetterGI Logo"
          className="w-8 h-8"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
        <h1 className="text-lg font-bold text-gray-900">BetterGI脚本仓库</h1>
      </div>

      {/* 搜索界面 - 调整移动距离避免超出屏幕 */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-out ${
          selectedItem
            ? "transform -translate-x-1/4 -translate-y-1/6 scale-75"
            : "transform translate-x-0 translate-y-0 scale-100"
        }`}
      >
        {/* 搜索文字 */}
        <div className="text-2xl md:text-3xl lg:text-4xl mb-8 text-center font-medium">
          在{" "}
          <DropdownMenu>
            <DropdownMenuTrigger className="underline hover:bg-gray-50 px-3 py-2 rounded-md inline-flex items-center gap-1 transition-all duration-200">
              {selectedCategory}
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
              {Object.keys(categoryMap).map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors rounded-md"
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {" "}脚本中，<br/>我需要{" "}
          <div className="wave-group">
            <input  value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="" 
                    className="input"/>
            <span className="bar"></span>

          </div>
        </div>

        {/* 搜索结果 */}
        {searchText.trim() && (
          <div className="space-y-3 max-w-md w-full">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className={`p-4 cursor-pointer text-left transition-all duration-300 transform rounded-lg ${
                    selectedItem?.name === item.name
                      ? "bg-gray-50 shadow-md scale-101 border-b-2 border-blue-500"
                      : "bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 border border-gray-100"
                  }`}
                  style={{
                    transitionDelay: selectedItem ? "0ms" : `${index * 50}ms`,
                  }}
                >
                  <div className="font-bold text-gray-900 text-sm leading-tight">{item.name}</div>
                  {item.description && (
                    <div
                      className="text-xs text-gray-600 mt-2 leading-relaxed"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.description.replace(/[#*`]/g, "")}
                    </div>
                  )}
                  {/* 显示匹配的标签 */}
                  {item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase())) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags
                        .filter((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))
                        .slice(0, 3)
                        .map((tag, tagIndex) => (
                          <Badge
                            key={tagIndex}
                            className="bg-blue-50 text-blue-600 border-0 rounded-sm px-1 py-0 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic text-center py-8">未找到匹配的结果</div>
            )}
          </div>
        )}

        {!searchText.trim() && (
          <div className="mt-8 text-sm text-gray-400 text-center">开始输入以搜索内容（支持名称、标签、描述搜索）</div>
        )}
      </div>

      {/* 右侧详情面板 */}
      <div
        className={`fixed top-0 right-0 w-2/3 h-full bg-white transition-all duration-700 ease-out ${
          selectedItem ? "transform translate-x-0 opacity-100" : "transform translate-x-full opacity-0"
        }`}
      >
        {selectedItem && (
          <div className="h-full flex flex-col">
            {/* 顶部返回按钮 */}
            <div className="p-6 border-b border-gray-100">
              <Button
                onClick={handleBack}
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
                className="max-w-2xl mx-auto transform transition-all duration-500 ease-out"
                style={{ transitionDelay: "200ms" }}
              >
                <div className="bg-white">
                  {/* 标题区 */}
                  <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{selectedItem.name}</h1>
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
                          <span>{formatDate(selectedItem.lastUpdated)}</span>
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 订阅按钮 */}
      <Button
        className={`fixed bottom-8 right-8 bg-blue-500 text-white hover:bg-blue-600 active:scale-98 border-0 rounded-md px-4 py-2 font-medium transition-all duration-300 transform shadow-lg hover:shadow-xl ${
          selectedItem ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
        }`}
        size="lg"
        style={{ transitionDelay: selectedItem ? "400ms" : "0ms" }}
      >
        <Subscribe className="w-4 h-4 mr-2" />
        订阅
      </Button>
    </div>
  )
}
