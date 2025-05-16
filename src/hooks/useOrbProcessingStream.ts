import { processImageWithORB } from "@/lib/orbProcessor"
import { useEffect } from "react"
import type Webcam from "react-webcam"

interface UseOrbProcessingStreamProps {
	webcamRef: React.RefObject<Webcam | null>
	canvasRef: React.RefObject<HTMLCanvasElement | null>
	isActive: boolean
	intervalMs?: number
	onFrameProcessed: (data: {
		processedDataUrl: string
		descriptorsArray: number[][]
	}) => void
	onProcessingError?: (error: unknown) => void
}

export function useOrbProcessingStream({
	webcamRef,
	canvasRef,
	isActive,
	intervalMs = 500, // A sensible default, can be overridden
	onFrameProcessed,
	onProcessingError,
}: UseOrbProcessingStreamProps) {
	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null

		const processCurrentFrame = async () => {
			if (
				!webcamRef.current ||
				!canvasRef.current ||
				!webcamRef.current.video?.HAVE_ENOUGH_DATA
			) {
				return
			}
			const imageSrc = webcamRef.current.getScreenshot()
			if (!imageSrc) {
				return
			}

			try {
				const result = await processImageWithORB(imageSrc, canvasRef.current)
				onFrameProcessed(result)
			} catch (error) {
				console.error(
					"useOrbProcessingStream: Error in processImageWithORB:",
					error,
				)
				onProcessingError?.(error)
			}
		}

		if (isActive) {
			intervalId = setInterval(processCurrentFrame, intervalMs)
		}

		return () => {
			if (intervalId) clearInterval(intervalId)
		}
	}, [
		isActive,
		webcamRef,
		canvasRef,
		intervalMs,
		onFrameProcessed,
		onProcessingError,
	])
}
