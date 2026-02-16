"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Minus, Plus, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/Button"

type PreviewType = "image" | "pdf"

type AttachmentPreviewModalProps = {
  open: boolean
  type: PreviewType | null
  url: string | null
  name: string | null
  onClose: () => void
}

export function AttachmentPreviewModal({ open, type, url, name, onClose }: AttachmentPreviewModalProps) {
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 })
  const [pdfZoom, setPdfZoom] = useState(100)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStartDistanceRef = useRef<number | null>(null)
  const pinchStartZoomRef = useRef(1)
  const pinchStartPanRef = useRef({ x: 0, y: 0 })
  const pinchStartCenterRef = useRef<{ x: number; y: number } | null>(null)
  const dragLastPointRef = useRef<{ x: number; y: number } | null>(null)
  const lastTapAtRef = useRef(0)
  const lastTapPointRef = useRef<{ x: number; y: number } | null>(null)

  const clampImagePan = (x: number, y: number, zoom: number) => {
    const viewport = viewportRef.current
    if (!viewport || zoom <= 1) return { x: 0, y: 0 }

    const rect = viewport.getBoundingClientRect()
    const maxX = ((zoom - 1) * rect.width) / 2
    const maxY = ((zoom - 1) * rect.height) / 2

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    }
  }

  const updateImageZoom = (nextZoom: number) => {
    const clampedZoom = Math.min(4, Math.max(0.25, Number(nextZoom.toFixed(2))))
    setImageZoom(clampedZoom)
    setImagePan((prev) => clampImagePan(prev.x, prev.y, clampedZoom))
  }

  useEffect(() => {
    if (open) {
      setImageZoom(1)
      setImagePan({ x: 0, y: 0 })
      setPdfZoom(100)
      pointersRef.current.clear()
      pinchStartDistanceRef.current = null
      pinchStartCenterRef.current = null
      dragLastPointRef.current = null
      lastTapAtRef.current = 0
      lastTapPointRef.current = null
    }
  }, [open, type, url])

  useEffect(() => {
    if (!open) return

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [open, onClose])

  const pdfUrl = useMemo(() => {
    if (!url) return null
    return `${url}#toolbar=1&navpanes=0&zoom=${pdfZoom}`
  }, [url, pdfZoom])

  const toPoint = (event: React.PointerEvent<HTMLDivElement>) => ({
    x: event.clientX,
    y: event.clientY
  })

  const getPinchData = () => {
    const points = [...pointersRef.current.values()]
    if (points.length < 2) return null

    const [p1, p2] = points
    const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
    const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y)

    return { center, distance }
  }

  const handleImagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(event.pointerId, toPoint(event))
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const handleImagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return

    pointersRef.current.set(event.pointerId, toPoint(event))
    const pinchData = getPinchData()

    if (pinchData) {
      if (pinchStartDistanceRef.current === null) {
        pinchStartDistanceRef.current = pinchData.distance
        pinchStartZoomRef.current = imageZoom
        pinchStartPanRef.current = imagePan
        pinchStartCenterRef.current = pinchData.center
        event.preventDefault()
        return
      }

      const startDistance = pinchStartDistanceRef.current || pinchData.distance
      const scaleRatio = pinchData.distance / Math.max(1, startDistance)
      const nextZoom = Math.min(4, Math.max(0.25, pinchStartZoomRef.current * scaleRatio))
      const startCenter = pinchStartCenterRef.current || pinchData.center
      const dx = pinchData.center.x - startCenter.x
      const dy = pinchData.center.y - startCenter.y
      const nextPan = clampImagePan(pinchStartPanRef.current.x + dx, pinchStartPanRef.current.y + dy, nextZoom)

      setImageZoom(nextZoom)
      setImagePan(nextPan)
      event.preventDefault()
      return
    }

    if (imageZoom > 1) {
      const point = toPoint(event)
      const last = dragLastPointRef.current
      if (last) {
        const nextPan = clampImagePan(imagePan.x + (point.x - last.x), imagePan.y + (point.y - last.y), imageZoom)
        setImagePan(nextPan)
      }
      dragLastPointRef.current = point
      event.preventDefault()
    }
  }

  const handleImagePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = toPoint(event)
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) {
      pinchStartDistanceRef.current = null
      pinchStartCenterRef.current = null
    }
    if (pointersRef.current.size === 0) {
      dragLastPointRef.current = null
    }

    if (event.pointerType === "touch") {
      const now = Date.now()
      const lastPoint = lastTapPointRef.current
      const isDoubleTap =
        now - lastTapAtRef.current < 280 &&
        lastPoint !== null &&
        Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < 28

      if (isDoubleTap) {
        if (imageZoom > 1) {
          setImageZoom(1)
          setImagePan({ x: 0, y: 0 })
        } else {
          const viewport = viewportRef.current
          if (viewport) {
            const rect = viewport.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            const nextZoom = 2
            const rawPanX = -(point.x - centerX)
            const rawPanY = -(point.y - centerY)
            setImageZoom(nextZoom)
            setImagePan(clampImagePan(rawPanX, rawPanY, nextZoom))
          } else {
            setImageZoom(2)
          }
        }

        lastTapAtRef.current = 0
        lastTapPointRef.current = null
        return
      }

      lastTapAtRef.current = now
      lastTapPointRef.current = point
    }
  }

  return (
    <AnimatePresence>
      {open && type && url ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-3 backdrop-blur-sm md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-panel flex h-[92vh] w-full max-w-7xl flex-col p-3 md:p-4"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Preview: {name ?? "Attachment"}</p>
                <p className="muted text-xs">{type === "image" ? "Image" : "PDF"} fullscreen preview</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {type === "image" ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => updateImageZoom(imageZoom - 0.25)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => updateImageZoom(imageZoom + 0.25)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setImageZoom(1)
                        setImagePan({ x: 0, y: 0 })
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setPdfZoom((prev) => Math.max(50, prev - 10))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setPdfZoom((prev) => Math.min(300, prev + 10))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setPdfZoom(100)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </>
                )}

                <Button type="button" variant="secondary" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-white/70 p-2">
              {type === "image" ? (
                <div
                  ref={viewportRef}
                  className="flex h-full min-h-full touch-none items-center justify-center overflow-hidden"
                  onPointerDown={handleImagePointerDown}
                  onPointerMove={handleImagePointerMove}
                  onPointerUp={handleImagePointerUp}
                  onPointerCancel={handleImagePointerUp}
                  onPointerLeave={handleImagePointerUp}
                >
                  <img
                    src={url}
                    alt={name ?? "preview"}
                    className="origin-center rounded-lg object-contain transition-transform"
                    style={{
                      transform: `translate3d(${imagePan.x}px, ${imagePan.y}px, 0) scale(${imageZoom})`,
                      maxHeight: "100%",
                      maxWidth: "100%"
                    }}
                  />
                </div>
              ) : (
                <iframe title={name ?? "pdf-preview"} src={pdfUrl ?? url} className="h-full w-full rounded-lg" />
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
