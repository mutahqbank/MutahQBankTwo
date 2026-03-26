"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { MoreHorizontal, ArrowDownRight } from "lucide-react"

interface ResizableImageProps {
  src: string
  alt?: string
  className?: string
  initialHeight?: number
  minHeight?: number
  maxHeight?: number
}

export function ResizableImage({
  src,
  alt = "Image figure",
  className,
  initialHeight = 256,
  minHeight = 100,
  maxHeight = 800
}: ResizableImageProps) {
  const [height, setHeight] = useState(initialHeight)
  const [isResizing, setIsResizing] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

  useEffect(() => {
    const dismissed = localStorage.getItem("dismissed_resize_note")
    if (!dismissed) {
      setShowNote(true)
    }
  }, [])

  const onResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsResizing(true)
    if (showNote) {
      setShowNote(false)
      localStorage.setItem("dismissed_resize_note", "true")
    }
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    startY.current = clientY
    startHeight.current = height
    
    // Add a class to body to prevent text selection and set cursor globally
    document.body.style.cursor = "ns-resize"
    document.body.style.userSelect = "none"
  }, [height])

  const onResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing) return

    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    const deltaY = clientY - startY.current
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight.current + deltaY))
    
    setHeight(newHeight)
  }, [isResizing, minHeight, maxHeight])

  const onResizeEnd = useCallback(() => {
    setIsResizing(false)
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", onResizeMove)
      window.addEventListener("mouseup", onResizeEnd)
      window.addEventListener("touchmove", onResizeMove, { passive: false })
      window.addEventListener("touchend", onResizeEnd)
    } else {
      window.removeEventListener("mousemove", onResizeMove)
      window.removeEventListener("mouseup", onResizeEnd)
      window.removeEventListener("touchmove", onResizeMove)
      window.removeEventListener("touchend", onResizeEnd)
    }

    return () => {
      window.removeEventListener("mousemove", onResizeMove)
      window.removeEventListener("mouseup", onResizeEnd)
      window.removeEventListener("touchmove", onResizeMove)
      window.removeEventListener("touchend", onResizeEnd)
    }
  }, [isResizing, onResizeMove, onResizeEnd])

  return (
    <div 
      className="group relative inline-block max-w-full overflow-hidden rounded-lg border border-border bg-muted/20"
      style={{ height: `${height}px` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-auto object-contain transition-all duration-300", className)}
        draggable={false}
      />
      
      {/* Resizing Handle - Red style as requested */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className={cn(
          "absolute bottom-0 right-0 z-10 flex h-8 w-10 cursor-ns-resize flex-col items-center justify-center rounded-tl-xl border-l border-t bg-destructive/10 backdrop-blur-sm transition-all hover:bg-destructive/20 active:bg-destructive/40 touch-none",
          isResizing ? "bg-destructive/30" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <div className="h-1 w-6 rounded-full bg-destructive shadow-sm" />
        <div className="mt-1 h-1 w-4 rounded-full bg-destructive/60 shadow-sm" />
      </div>

      {showNote && (
        <div className="absolute bottom-10 right-2 z-20 flex animate-bounce items-center gap-2 rounded-md bg-[#f3f4f6] p-3 text-[11px] font-medium text-gray-700 shadow-xl ring-1 ring-gray-300/50 italic" style={{ fontFamily: 'monospace' }}>
          <span>Need a closer look? Drag here to resize.</span>
          <ArrowDownRight className="h-4 w-4 text-gray-500" />
        </div>
      )}

      {/* Touch indicator for mobile */}
      <div className="absolute bottom-1 right-2 pointer-events-none opacity-40 group-hover:opacity-0 sm:hidden">
         <MoreHorizontal className="h-4 w-4 text-destructive" />
      </div>

      {/* Overlay during resize to prevent pointer events interference */}
      {isResizing && <div className="absolute inset-0 z-0 bg-transparent" />}
    </div>
  )
}
