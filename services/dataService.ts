import {
  type RepoData,
  type DataSource,
  type DataItem,
  categoryMap,
  type CategoryKey,
  type GroupedDataItem,
  type Author,
  type UnifiedDataItem,
} from "@/types"

// 数据源配置
export const DATA_SOURCES: DataSource[] = [
  {
    url: "https://raw.githubusercontent.com/babalae/bettergi-scripts-list/refs/heads/main/repo.json",
    name: "主仓库",
  },
  {
    url: "https://hub.gitmirror.com/https://raw.githubusercontent.com/babalae/bettergi-scripts-list/refs/heads/main/repo.json",
    name: "备用仓库",
  },
]

export class DataService {
  private static instance: DataService
  private data: RepoData | null = null
  private processedData: Map<CategoryKey, UnifiedDataItem[]> = new Map()

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }

  /**
   * 生成订阅字符串
   */
  private generateSubscriptionString(pathArray: string[], rootCategory: string, fileName?: string): string {
    try {
      let finalPath: string

      // 根据根类别决定路径格式
      if (rootCategory === "pathing") {
        // pathing类别：路径到目录级别，不包含文件名
        finalPath = pathArray.join("/")
      } else {
        // 其他类别（combat、js、tcg）：路径包含文件名
        const pathWithFile = fileName ? [...pathArray, fileName] : pathArray
        finalPath = pathWithFile.join("/")
      }

      // 将路径转换为JSON数组字符串格式
      const pathArrayString = JSON.stringify([finalPath])

      // URL编码
      const urlEncoded = encodeURIComponent(pathArrayString)

      // UTF-8 Base64编码
      const base64String = btoa(unescape(encodeURIComponent(urlEncoded)))

      // 拼接完整字符串
      return `bettergi://script?import=${base64String}`
    } catch (error) {
      console.error("生成订阅字符串失败:", error)
      return ""
    }
  }

  /**
   * 递归解析数据项，查找hash字段并构建路径
   */
  private parseDataItemWithPath(item: DataItem, currentPath: string[] = [], rootCategory = ""): DataItem[] {
    const results: DataItem[] = []
    const newPath = [...currentPath, item.name]

    // 如果当前项有hash字段，迭代终止
    if (item.hash) {
      // 对于pathing类别，path不包含数据元素本身
      // 对于其他类别，path需要包含文件名
      let pathArray: string[]
      let subscriptionString: string

      if (rootCategory === "pathing") {
        // pathing类别：路径不包含文件名
        pathArray = [...currentPath]
        subscriptionString = this.generateSubscriptionString(pathArray, rootCategory)
      } else {
        // 其他类别：路径包含文件名
        pathArray = [...currentPath]
        subscriptionString = this.generateSubscriptionString(pathArray, rootCategory, item.name)
      }

      // 生成显示名称（保持原有格式用于向后兼容）
      // 显示路径时不包含根类别，只显示子路径
      const displayPath = currentPath.length > 1 ? currentPath.slice(1) : currentPath
      const displayName = displayPath.length > 0 ? `${item.name}【${displayPath.join("|")}】` : item.name

      return [
        {
          ...item,
          name: displayName,
          path: displayPath.join(" | "), // 显示用的路径字符串（不包含根类别）
          pathArray: pathArray, // 完整的路径数组（包含根类别）
          originalName: item.name, // 保留原始名称
          subscriptionString: subscriptionString, // 订阅字符串
          rootCategory: rootCategory, // 保存根类别信息
        },
      ]
    }

    // 如果没有hash但有children，递归处理children
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        const childResults = this.parseDataItemWithPath(child, newPath, rootCategory)
        results.push(...childResults)
      }
    } else {
      // 没有hash也没有children，记录当前路径
      let pathArray: string[]
      let subscriptionString: string

      if (rootCategory === "pathing") {
        pathArray = [...currentPath]
        subscriptionString = this.generateSubscriptionString(pathArray, rootCategory)
      } else {
        pathArray = [...currentPath]
        subscriptionString = this.generateSubscriptionString(pathArray, rootCategory, item.name)
      }

      // 显示路径时不包含根类别
      const displayPath = currentPath.length > 1 ? currentPath.slice(1) : currentPath
      const displayName = displayPath.length > 0 ? `${item.name}【${displayPath.join("|")}】` : item.name

      results.push({
        ...item,
        name: displayName,
        path: displayPath.join(" | "),
        pathArray: pathArray, // 完整的路径数组（包含根类别）
        originalName: item.name,
        subscriptionString: subscriptionString,
        rootCategory: rootCategory,
      })
    }

    return results
  }

  /**
   * 处理原始数据，解析所有数据项
   */
  private processRawData(rawData: RepoData): RepoData {
    const processedIndexes = rawData.indexes.map((index) => ({
      ...index,
      // 将index.name作为初始路径和根类别传入
      children: index.children.flatMap((child) => this.parseDataItemWithPath(child, [index.name], index.name)),
    }))

    return {
      ...rawData,
      indexes: processedIndexes,
    }
  }

  /**
   * 聚合作者信息
   */
  private aggregateAuthors(items: DataItem[]): Author[] {
    const authorSet = new Set<string>()
    const authorMap = new Map<string, Author>()

    items.forEach((item) => {
      // 处理单个作者
      if (item.author) {
        if (!authorSet.has(item.author)) {
          authorSet.add(item.author)
          authorMap.set(item.author, { name: item.author })
        }
      }

      // 处理多个作者
      if (item.authors && item.authors.length > 0) {
        item.authors.forEach((author) => {
          if (!authorSet.has(author.name)) {
            authorSet.add(author.name)
            authorMap.set(author.name, author)
          }
        })
      }
    })

    return Array.from(authorMap.values())
  }

  /**
   * 获取最晚的更新时间
   */
  private getLatestUpdateTime(items: DataItem[]): string | undefined {
    const validDates = items
      .map((item) => item.lastUpdated)
      .filter((date): date is string => !!date)
      .map((dateString) => {
        try {
          return new Date(dateString)
        } catch {
          return null
        }
      })
      .filter((date): date is Date => date !== null)

    if (validDates.length === 0) return undefined

    const latestDate = new Date(Math.max(...validDates.map((date) => date.getTime())))
    return latestDate.toISOString()
  }

  /**
   * 聚合标签
   */
  private aggregateTags(items: DataItem[]): string[] {
    const tagSet = new Set<string>()

    items.forEach((item) => {
      if (item.tags && item.tags.length > 0) {
        item.tags.forEach((tag) => tagSet.add(tag))
      }
    })

    return Array.from(tagSet)
  }

  /**
   * 按订阅字符串分组数据项（用于地图追踪类别）
   */
  public groupItemsBySubscription(items: DataItem[]): GroupedDataItem[] {
    const subscriptionGroups = new Map<string, DataItem[]>()

    // 按订阅字符串分组
    items.forEach((item) => {
      if (item.subscriptionString) {
        if (!subscriptionGroups.has(item.subscriptionString)) {
          subscriptionGroups.set(item.subscriptionString, [])
        }
        subscriptionGroups.get(item.subscriptionString)!.push(item)
      }
    })

    // 转换为GroupedDataItem数组
    return Array.from(subscriptionGroups.entries()).map(([subscriptionString, groupItems]) => {
      // 生成聚合名称：地图追踪-path1-path2
      const firstItem = groupItems[0]
      let aggregatedName = "地图追踪"

      if (firstItem?.pathArray && firstItem.pathArray.length > 1) {
        // 去掉根类别，只取子路径
        const subPaths = firstItem.pathArray.slice(1)
        if (subPaths.length > 0) {
          aggregatedName = `地图追踪-${subPaths.join("-")}`
        }
      }

      // 聚合作者信息
      const aggregatedAuthors = this.aggregateAuthors(groupItems)

      // 获取最晚更新时间
      const latestUpdateTime = this.getLatestUpdateTime(groupItems)

      // 聚合标签
      const aggregatedTags = this.aggregateTags(groupItems)

      // 生成描述：原数据元素的名称，保持换行显示
      const originalNames = groupItems.map((item) => {
        // 提取原始名称（去掉路径信息）
        const match = item.name.match(/^(.+?)【/)
        return match ? match[1] : item.originalName || item.name
      })
      const description = originalNames.join("\n")

      return {
        id: subscriptionString,
        name: aggregatedName,
        description: description,
        fullPath: firstItem?.path || "",
        items: groupItems,
        count: groupItems.length,
        subscriptionString: subscriptionString,
        // 聚合的元数据
        authors: aggregatedAuthors,
        lastUpdated: latestUpdateTime,
        tags: aggregatedTags,
        rootCategory: "pathing",
      }
    })
  }

  /**
   * 将GroupedDataItem转换为UnifiedDataItem
   */
  private groupedItemToUnified(groupedItem: GroupedDataItem): UnifiedDataItem {
    return {
      type: "grouped",
      data: groupedItem,
      // 用于搜索的字段
      name: groupedItem.name,
      description: groupedItem.description,
      tags: groupedItem.tags,
      authors: groupedItem.authors,
      lastUpdated: groupedItem.lastUpdated,
      subscriptionString: groupedItem.subscriptionString,
    }
  }

  /**
   * 将DataItem转换为UnifiedDataItem
   */
  private dataItemToUnified(dataItem: DataItem): UnifiedDataItem {
    return {
      type: "single",
      data: dataItem,
      // 用于搜索的字段
      name: dataItem.name,
      description: dataItem.description,
      tags: dataItem.tags,
      authors: dataItem.authors,
      lastUpdated: dataItem.lastUpdated,
      subscriptionString: dataItem.subscriptionString,
    }
  }

  /**
   * 预处理所有类别的数据
   */
  private preprocessAllData(data: RepoData): void {
    this.processedData.clear()

    // 处理各个类别
    Object.keys(categoryMap).forEach((category) => {
      const categoryKey = category as CategoryKey
      const rawItems = this.getRawItemsByCategory(data, categoryKey)

      if (categoryKey === "地图追踪") {
        // 地图追踪类别：只使用聚合数据
        const groupedItems = this.groupItemsBySubscription(rawItems)
        const unifiedItems = groupedItems.map((item) => this.groupedItemToUnified(item))
        this.processedData.set(categoryKey, unifiedItems)
      } else if (categoryKey === "全部") {
        // 全部类别：包含其他类别的原始数据 + 地图追踪的聚合数据
        const allUnifiedItems: UnifiedDataItem[] = []

        // 添加地图追踪的聚合数据
        const pathingItems = this.getRawItemsByCategory(data, "地图追踪")
        const pathingGrouped = this.groupItemsBySubscription(pathingItems)
        allUnifiedItems.push(...pathingGrouped.map((item) => this.groupedItemToUnified(item)))
        console.log('地图追踪聚合数据:', pathingGrouped) // 添加日志输出
        // 添加其他类别的原始数据
        const otherCategories: CategoryKey[] = ["JS脚本", "战斗策略", "七圣召唤"]
        otherCategories.forEach((cat) => {
          const items = this.getRawItemsByCategory(data, cat)
          allUnifiedItems.push(...items.map((item) => this.dataItemToUnified(item)))
        })

        this.processedData.set(categoryKey, allUnifiedItems)
      } else {
        // 其他类别：使用原始数据
        const unifiedItems = rawItems.map((item) => this.dataItemToUnified(item))
        this.processedData.set(categoryKey, unifiedItems)
      }
    })
  }

  /**
   * 获取原始数据项（不经过预处理）
   */
  private getRawItemsByCategory(data: RepoData, category: CategoryKey): DataItem[] {
    if (category === "全部") {
      return data.indexes.flatMap((index) => index.children)
    } else {
      const categoryKey = categoryMap[category]
      const targetIndex = data.indexes.find((index) => index.name === categoryKey)
      return targetIndex?.children || []
    }
  }

  /**
   * 复制文本到剪切板
   */
  public async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // 使用现代 Clipboard API
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // 降级方案：使用传统方法
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand("copy")
        document.body.removeChild(textArea)
        return successful
      }
    } catch (error) {
      console.error("复制到剪切板失败:", error)
      return false
    }
  }

  /**
   * 模拟进度条增长
   */
  public simulateProgress(duration: number, onProgress: (progress: number) => void): () => void {
    const steps = 50
    const increment = 100 / steps
    const stepDuration = duration / steps

    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += increment
      if (currentProgress >= 95) {
        clearInterval(interval)
        onProgress(95)
      } else {
        onProgress(currentProgress)
      }
    }, stepDuration)

    // 返回清理函数
    return () => clearInterval(interval)
  }

  /**
   * 从单个数据源获取数据
   */
  private async fetchFromSource(source: DataSource, signal?: AbortSignal): Promise<RepoData> {
    const response = await fetch(source.url, { signal })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const rawData = await response.json()
    const processedData = this.processRawData(rawData)

    // 预处理所有类别的数据
    this.preprocessAllData(processedData)

    return processedData
  }

  /**
   * 使用多源fallback机制获取数据
   */
  public async fetchDataWithFallback(
    onProgress: (progress: number) => void,
    onSourceChange: (sourceName: string) => void,
  ): Promise<RepoData> {
    for (let i = 0; i < DATA_SOURCES.length; i++) {
      const source = DATA_SOURCES[i]
      onSourceChange(source.name)

      try {
        // 开始模拟进度
        const clearProgress = this.simulateProgress(3000, onProgress)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

        const jsonData = await this.fetchFromSource(source, controller.signal)

        clearTimeout(timeoutId)
        clearProgress()

        // 完成进度条
        onProgress(100)

        // 缓存数据
        this.data = jsonData

        // 成功获取数据后立即返回，不再尝试其他源
        return jsonData
      } catch (err) {
        console.warn(`Failed to fetch from ${source.name}:`, err)
        onProgress(0)

        // 如果不是最后一个源，继续尝试下一个
        if (i < DATA_SOURCES.length - 1) {
          continue
        } else {
          // 所有源都失败了
          throw new Error("无法从任何数据源获取数据，请检查网络连接后重试")
        }
      }
    }

    throw new Error("所有数据源均不可用")
  }

  /**
   * 根据类别获取统一数据项
   */
  public getUnifiedItemsByCategory(category: CategoryKey): UnifiedDataItem[] {
    return this.processedData.get(category) || []
  }

  /**
   * 筛选统一数据项
   */
  public filterUnifiedItems(items: UnifiedDataItem[], searchText: string): UnifiedDataItem[] {
    if (!searchText.trim()) {
      return items
    }

    const searchLower = searchText.toLowerCase()
    return items.filter((item) => {
      // 搜索名称
      const nameMatch = item.name?.toLowerCase().includes(searchLower) || false

      // 搜索描述
      const descMatch = item.description?.toLowerCase().includes(searchLower) || false

      // 搜索标签
      const tagMatch = item.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) || false

      // 搜索作者
      const authorMatch = item.authors?.some((author) => author.name.toLowerCase().includes(searchLower)) || false

      // 对于单个数据项，还要搜索路径等信息
      if (item.type === "single") {
        const dataItem = item.data as DataItem
        const pathMatch = dataItem.path?.toLowerCase().includes(searchLower) || false
        const fullPathMatch =
          dataItem.pathArray?.some((pathPart) => pathPart.toLowerCase().includes(searchLower)) || false
        const originalNameMatch = dataItem.originalName?.toLowerCase().includes(searchLower) || false

        return nameMatch || descMatch || tagMatch || authorMatch || pathMatch || fullPathMatch || originalNameMatch
      }

      return nameMatch || descMatch || tagMatch || authorMatch
    })
  }

  /**
   * 获取筛选后的统一数据项
   */
  public getFilteredUnifiedItems(category: CategoryKey, searchText: string): UnifiedDataItem[] {
    const items = this.getUnifiedItemsByCategory(category)
    return this.filterUnifiedItems(items, searchText)
  }

  /**
   * 兼容性方法：获取筛选后的数据项（返回单个数据项）
   */
  public getFilteredItems(data: RepoData, category: CategoryKey, searchText: string): DataItem[] {
    const unifiedItems = this.getFilteredUnifiedItems(category, searchText)
    return unifiedItems.filter((item) => item.type === "single").map((item) => item.data as DataItem)
  }

  /**
   * 兼容性方法：获取筛选后的分组数据项
   */
  public getFilteredGroupedItems(data: RepoData, category: CategoryKey, searchText: string): GroupedDataItem[] {
    const unifiedItems = this.getFilteredUnifiedItems(category, searchText)
    return unifiedItems.filter((item) => item.type === "grouped").map((item) => item.data as GroupedDataItem)
  }

  /**
   * 检查标签是否匹配搜索文本
   */
  public getMatchingTags(tags: string[] | undefined, searchText: string): string[] {
    if (!tags || !searchText.trim()) {
      return []
    }

    const searchLower = searchText.toLowerCase()
    return tags.filter((tag) => tag.toLowerCase().includes(searchLower))
  }

  /**
   * 格式化日期
   */
  public formatDate(dateString?: string): string {
    if (!dateString) return ""

    try {
      const date = new Date(dateString)
      return `更新于 ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
    } catch {
      return `更新于 ${dateString}`
    }
  }

  /**
   * 获取缓存的数据
   */
  public getCachedData(): RepoData | null {
    return this.data
  }

  /**
   * 清除缓存的数据
   */
  public clearCache(): void {
    this.data = null
    this.processedData.clear()
  }

  /**
   * 调试方法：打印路径信息
   */
  public debugPathInfo(item: DataItem): void {
    console.log("=== 路径调试信息 ===")
    console.log("原始名称:", item.originalName)
    console.log("显示名称:", item.name)
    console.log("显示路径:", item.path)
    console.log("完整路径数组:", item.pathArray)
    console.log("根类别:", item.rootCategory)
    console.log("订阅字符串:", item.subscriptionString)

    if (item.pathArray && item.rootCategory) {
      // 重新生成订阅字符串以验证
      let finalPath: string
      if (item.rootCategory === "pathing") {
        finalPath = item.pathArray.join("/")
      } else {
        const pathWithFile = [...item.pathArray, item.originalName || item.name]
        finalPath = pathWithFile.join("/")
      }

      console.log("最终路径:", finalPath)

      const pathArrayString = JSON.stringify([finalPath])
      console.log("JSON数组字符串:", pathArrayString)

      const urlEncoded = encodeURIComponent(pathArrayString)
      console.log("URL编码:", urlEncoded)

      const base64String = btoa(unescape(encodeURIComponent(urlEncoded)))
      console.log("Base64编码:", base64String)

      const fullSubscriptionString = `bettergi://script?import=${base64String}`
      console.log("完整订阅字符串:", fullSubscriptionString)
    }
    console.log("==================")
  }
}

// 导出单例实例
export const dataService = DataService.getInstance()
