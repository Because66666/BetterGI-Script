export interface Author {
  name: string
  link?: string
}

export interface DataItem {
  name: string
  originalName?: string // 保留原始名称
  author?: string
  authors?: Author[]
  description?: string
  tags?: string[]
  lastUpdated?: string
  hash?: string
  children?: DataItem[]
  path?: string // 显示用的路径字符串
  pathArray?: string[] // 新的路径数组格式
  subscriptionString?: string // 订阅字符串
  rootCategory?: string // 根类别信息
}

export interface GroupedDataItem {
  id: string
  name: string // 聚合后的名称
  description?: string // 聚合后的描述
  fullPath: string
  items: DataItem[]
  count: number
  subscriptionString?: string // 分组的订阅字符串
  // 聚合的元数据
  authors?: Author[] // 聚合的作者信息
  lastUpdated?: string // 最晚的更新时间
  tags?: string[] // 聚合的标签
  rootCategory?: string // 根类别
}

// 统一数据项类型，用于统一处理单个数据项和聚合数据项
export interface UnifiedDataItem {
  type: "single" | "grouped"
  data: DataItem | GroupedDataItem
  // 用于搜索的统一字段
  name?: string
  description?: string
  tags?: string[]
  authors?: Author[]
  lastUpdated?: string
  subscriptionString?: string
}

export interface IndexData {
  name: string
  children: DataItem[]
  hash?: string
}

export interface RepoData {
  indexes: IndexData[]
}

export interface DataSource {
  url: string
  name: string
}

export interface LoadingState {
  loading: boolean
  progress: number
  currentSource: string
  error: string | null
}

export const categoryMap = {
  全部: "all",
  地图追踪: "pathing",
  JS脚本: "js",
  战斗策略: "combat",
  七圣召唤: "tcg",
} as const

export type CategoryKey = keyof typeof categoryMap
