"use client"

import { useState, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DynamicInput } from "@/components/DynamicInput"
import { SearchResults } from "@/components/SearchResults"
import { DetailPanel } from "@/components/DetailPanel"
import { LoadingScreen } from "@/components/LoadingScreen"
import { useDataFetching } from "@/hooks/useDataFetching"
import { dataService } from "@/services/dataService"
import { type DataItem, type GroupedDataItem, type CategoryKey, categoryMap } from "@/types"

export default function Component() {
  const { data, loadingState, refetch } = useDataFetching()
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("全部")
  const [searchText, setSearchText] = useState("")
  const [selectedItem, setSelectedItem] = useState<DataItem | GroupedDataItem | null>(null)

  // 判断是否为地图追踪类别
  const isPathingCategory = selectedCategory === "地图追踪"

  const { filteredItems, filteredGroupedItems } = useMemo(() => {
    if (!data) return { filteredItems: [], filteredGroupedItems: [] }

    // 使用新的统一数据获取方法
    const unifiedItems = dataService.getFilteredUnifiedItems(selectedCategory, searchText)

    if (isPathingCategory) {
      // 地图追踪类别只返回聚合数据
      return {
        filteredItems: [],
        filteredGroupedItems: unifiedItems
          .filter((item) => item.type === "grouped")
          .map((item) => item.data as GroupedDataItem),
      }
    } else {
      // 其他类别可能包含单个数据项和聚合数据项
      const singleItems = unifiedItems.filter((item) => item.type === "single").map((item) => item.data as DataItem)

      const groupedItems = unifiedItems
        .filter((item) => item.type === "grouped")
        .map((item) => item.data as GroupedDataItem)

      return {
        filteredItems: singleItems,
        filteredGroupedItems: groupedItems,
      }
    }
  }, [data, selectedCategory, searchText, isPathingCategory])

  const handleItemClick = (item: DataItem | GroupedDataItem) => {
    setSelectedItem(item)
  }

  const handleBack = () => {
    setSelectedItem(null)
  }

  // 加载界面
  if (loadingState.loading) {
    return <LoadingScreen loadingState={loadingState} onRetry={refetch} />
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
          src="/favicon.ico"
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
        <div className="text-2xl md:text-3xl lg:text-4xl mb-8 text-center font-medium flex flex-wrap items-center justify-center gap-2">
          <span>在</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="underline hover:bg-gray-50 px-3 py-2 rounded-md inline-flex items-center gap-1 transition-all duration-200">
              {selectedCategory}
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
              {Object.keys(categoryMap).map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category as CategoryKey)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors rounded-md"
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span>类别中，我需要</span>
          <DynamicInput
            value={searchText}
            onChange={setSearchText}
            placeholder=""
            baseClassName="text-2xl md:text-3xl lg:text-4xl"
          />
        </div>

        {/* 搜索结果 - 添加动画 */}
        <div
          className={`transition-all duration-500 ease-out ${
            searchText.trim() ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4"
          }`}
        >
          {searchText.trim() && (
            <SearchResults
              items={filteredItems}
              groupedItems={filteredGroupedItems}
              searchText={searchText}
              selectedItem={selectedItem}
              onItemClick={handleItemClick}
              isGrouped={isPathingCategory}
            />
          )}
        </div>

        {!searchText.trim() && (
          <div className="mt-8 text-sm text-gray-400 text-center transition-all duration-300">
            开始输入以搜索内容（支持名称、标签、描述、路径搜索）
            {isPathingCategory && <div className="mt-2 text-xs text-blue-500">地图追踪类别将按订阅字符串聚合显示</div>}
          </div>
        )}
      </div>

      {/* 右侧详情面板 */}
      {selectedItem && <DetailPanel selectedItem={selectedItem} onBack={handleBack} />}
    </div>
  )
}
