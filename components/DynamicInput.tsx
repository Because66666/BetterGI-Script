"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface DynamicInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  baseClassName?: string
}

export function DynamicInput({
  value,
  onChange,
  placeholder = "",
  className = "",
  baseClassName = "text-2xl md:text-3xl lg:text-4xl",
}: DynamicInputProps) {
  const [fontSize, setFontSize] = useState(baseClassName)
  const [shouldWrap, setShouldWrap] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!inputRef.current || !measureRef.current) return

    const input = inputRef.current
    const measure = measureRef.current

    // 设置测量元素的样式与输入框相同
    measure.style.fontSize = getComputedStyle(input).fontSize
    measure.style.fontFamily = getComputedStyle(input).fontFamily
    measure.style.fontWeight = getComputedStyle(input).fontWeight
    measure.textContent = value || placeholder

    const inputWidth = input.offsetWidth
    const textWidth = measure.scrollWidth

    // 如果文本宽度超过输入框宽度
    if (textWidth > inputWidth && value.length > 0) {
      // 尝试缩小字体
      const scaleFactor = Math.max(0.6, inputWidth / textWidth)

      if (scaleFactor < 0.8) {
        // 如果缩放因子太小，启用换行
        setShouldWrap(true)
        setFontSize("text-lg md:text-xl lg:text-2xl")
      } else {
        // 否则只是缩小字体
        setShouldWrap(false)
        if (scaleFactor < 0.9) {
          setFontSize("text-lg md:text-xl lg:text-2xl")
        } else {
          setFontSize(baseClassName)
        }
      }
    } else {
      // 文本宽度正常，恢复原始大小
      setShouldWrap(false)
      setFontSize(baseClassName)
    }
  }, [value, placeholder, baseClassName])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="relative inline-block">
      {/* 隐藏的测量元素 */}
      <div
        ref={measureRef}
        className="absolute invisible whitespace-nowrap"
        style={{ top: 0, left: 0, pointerEvents: "none" }}
      />

      {/* 实际的输入框 */}
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "inline-block w-48 border-0 border-b-2 border-gray-300 bg-transparent text-center outline-none focus:outline-none focus:ring-0 focus:border-blue-500 rounded-none transition-all duration-300 font-medium",
          fontSize,
          shouldWrap && "whitespace-normal break-words min-h-[1.2em]",
          className,
        )}
        style={{
          minWidth: shouldWrap ? "200px" : "auto",
          maxWidth: shouldWrap ? "300px" : "auto",
          wordBreak: shouldWrap ? "break-all" : "normal",
          lineHeight: shouldWrap ? "1.2" : "normal",
        }}
      />
    </div>
  )
}
