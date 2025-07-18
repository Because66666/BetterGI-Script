"use client"

import { useState, useEffect } from "react"
import type { RepoData, LoadingState } from "@/types"
import { dataService } from "@/services/dataService"

export function useDataFetching() {
  const [data, setData] = useState<RepoData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    loading: true,
    progress: 0,
    currentSource: "",
    error: null,
  })

  const fetchData = async () => {
    setLoadingState({
      loading: true,
      progress: 0,
      currentSource: "",
      error: null,
    })

    try {
      const jsonData = await dataService.fetchDataWithFallback(
        (progress) => {
          setLoadingState((prev) => ({ ...prev, progress }))
        },
        (sourceName) => {
          setLoadingState((prev) => ({ ...prev, currentSource: sourceName }))
        },
      )

      // 短暂延迟以显示完成状态
      setTimeout(() => {
        setData(jsonData)
        setLoadingState((prev) => ({ ...prev, loading: false }))
      }, 500)
    } catch (error) {
      setLoadingState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "未知错误",
      }))
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    data,
    loadingState,
    refetch: fetchData,
  }
}
