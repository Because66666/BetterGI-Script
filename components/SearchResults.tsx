"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { dataService } from "@/services/dataService"
import type { DataItem, GroupedDataItem } from "@/types"

interface SearchResultsProps {
  items: DataItem[]
  groupedItems?: GroupedDataItem[]
  searchText: string
  selectedItem: DataItem | GroupedDataItem | null
  onItemClick: (item: DataItem | GroupedDataItem) => void
  isGrouped?: boolean
}

export function SearchResults({
  items,
  groupedItems,
  searchText,
  selectedItem,
  onItemClick,
  isGrouped = false,
}: SearchResultsProps) {
  const [visibleCount, setVisibleCount] = useState(5)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget

    // 当滚动到底部附近时加载更多（提前50px触发）
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      // 使用与 displayItems 相同的 totalItems 计算逻辑
      const totalItemsCount = isGrouped 
        ? groupedItems?.length || 0 
        : (items.length + (groupedItems?.length || 0))
      
      if (visibleCount < totalItemsCount) {
        setVisibleCount((prev) => Math.min(prev + 5, totalItemsCount))
      }
    }
  }

  // 重置可见数量当搜索文本改变时
  useEffect(() => {
    setVisibleCount(5)
  }, [searchText, isGrouped])

  // 修复：在非分组模式下，合并单个项目和聚合项目
  const displayItems = isGrouped 
    ? groupedItems?.slice(0, visibleCount) || [] 
    : [
        ...(groupedItems || []),
        ...items
      ].slice(0, visibleCount)
  
  const totalItems = isGrouped 
    ? groupedItems?.length || 0 
    : (items.length + (groupedItems?.length || 0))

  return (
    <div ref={containerRef} className="space-y-3 max-w-md w-full max-h-96 overflow-y-auto" onScroll={handleScroll}>
      {displayItems.length > 0 ? (
        <>
          {isGrouped
            ? (displayItems as GroupedDataItem[]).map((group, index) => (
                <div
                  key={group.id}
                  onClick={() => onItemClick(group)}
                  className={`p-4 cursor-pointer text-left transition-all duration-300 transform rounded-lg opacity-0 animate-fade-in-up ${
                    selectedItem && "id" in selectedItem && selectedItem.id === group.id
                      ? "bg-gray-50 shadow-md scale-101 border-b-2 border-blue-500"
                      : "bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 border border-gray-100"
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="font-bold text-gray-900 text-sm leading-tight flex items-center justify-between">
                    <span>{group.name}</span>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{group.count} 项</span>
                  </div>

                  {/* 显示描述（包含的项目列表） */}
                  {group.description && (
                    <div
                      className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {group.description}
                    </div>
                  )}

                  {/* 显示完整路径信息（调试用） */}
                  {/* {group.items[0]?.pathArray && (
                    <div className="text-xs text-purple-600 mt-1 font-mono">
                      完整路径: {group.items[0].pathArray.join("/")}
                    </div>
                  )} */}
                </div>
              ))
            : displayItems.map((item, index) => {
                // 判断是聚合项目还是单个项目
                if ('count' in item && 'id' in item) {
                  // 渲染聚合项目
                  const group = item as GroupedDataItem
                  return (
                    <div
                      key={group.id}
                      onClick={() => onItemClick(group)}
                      className={`p-4 cursor-pointer text-left transition-all duration-300 transform rounded-lg opacity-0 animate-fade-in-up ${
                        selectedItem && "id" in selectedItem && selectedItem.id === group.id
                          ? "bg-gray-50 shadow-md scale-101 border-b-2 border-blue-500"
                          : "bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 border border-gray-100"
                      }`}
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: "forwards",
                      }}
                    >
                      <div className="font-bold text-gray-900 text-sm leading-tight flex items-center justify-between">
                        <span>{group.name}</span>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{group.count} 项</span>
                      </div>

                      {/* 显示描述（包含的项目列表） */}
                      {group.description && (
                        <div
                          className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {group.description}
                        </div>
                      )}
                    </div>
                  )
                } else {
                  // 渲染单个项目
                  const dataItem = item as DataItem
                  const matchingTags = dataService.getMatchingTags(dataItem.tags, searchText)
                  const { displayName, pathInfo } = parseNameAndPath(dataItem.name)

                  return (
                    <div
                      key={`${dataItem.name}-${index}`}
                      onClick={() => {
                        onItemClick(dataItem)
                        // 调试：打印路径信息
                        // dataService.debugPathInfo(dataItem)
                      }}
                      className={`p-4 cursor-pointer text-left transition-all duration-300 transform rounded-lg opacity-0 animate-fade-in-up ${
                        selectedItem && "name" in selectedItem && selectedItem.name === dataItem.name
                          ? "bg-gray-50 shadow-md scale-101 border-b-2 border-blue-500"
                          : "bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 border border-gray-100"
                      }`}
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: "forwards",
                      }}
                    >
                      <div className="font-bold text-gray-900 text-sm leading-tight">
                        {displayName}
                        {/* {pathInfo && <span className="text-xs text-blue-600 font-normal ml-2">【{pathInfo}】</span>} */}
                      </div>

                      {dataItem.description && (
                        <div
                          className="text-xs text-gray-600 mt-2 leading-relaxed"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {dataItem.description.replace(/[#*`]/g, "")}
                        </div>
                      )}

                      {/* 显示hash信息 */}
                      {/* {dataItem.hash && (
                        <div className="text-xs text-green-600 mt-1 font-mono">Hash: {dataItem.hash.substring(0, 8)}...</div>
                      )} */}

                      {/* 显示完整路径信息（调试用） */}
                      {/* {dataItem.pathArray && (
                        <div className="text-xs text-purple-600 mt-1 font-mono">完整路径: {dataItem.pathArray.join("/")}</div>
                      )} */}

                      {/* 显示匹配的标签 */}
                      {matchingTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {matchingTags.slice(0, 3).map((tag, tagIndex) => (
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
                  )
                }
              })}

          {/* 加载更多提示 */}
          {visibleCount < totalItems && (
            <div className="text-center py-4 text-sm text-gray-400">
              继续滚动查看更多 ({visibleCount}/{totalItems})
            </div>
          )}
        </>
      ) : (
        <div
          className="text-gray-500 italic text-center py-8 opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          未找到匹配的结果
        </div>
      )}
    </div>
  )
}
