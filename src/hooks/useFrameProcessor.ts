import axios from "axios"
import { useCallback } from "react" // useEffect removed, useCallback added
import type Webcam from "react-webcam"
// import { toast } from "sonner";

import type { GetterRequest } from "@/types"
import { useOrbProcessingStream } from "./useOrbProcessingStream" // Import the new hook

interface UseFrameProcessorProps {
	webcamRef: React.RefObject<Webcam | null>
	canvasRef: React.RefObject<HTMLCanvasElement | null>
	passCode: string
	apiUrl: string | undefined
	minPasscodeLength: number
	captureStarted: "stopped" | "processing"
	onProcessingSuccess: (words: string) => void
	onProcessingStop: () => void
	onProcessedImageUpdate: (dataUrl: string) => void
	onProcessingError: (message: string, error?: unknown) => void
}

export function useFrameProcessor({
	webcamRef,
	canvasRef,
	passCode,
	apiUrl,
	minPasscodeLength,
	captureStarted,
	onProcessingSuccess,
	onProcessingStop,
	onProcessedImageUpdate,
	onProcessingError,
}: UseFrameProcessorProps) {
	const isActive = captureStarted === "processing"

	const handleGetWordsFrameProcessed = useCallback(
		async (data: {
			processedDataUrl: string
			descriptorsArray: number[][]
		}) => {
			if (
				!webcamRef.current ||
				!canvasRef.current ||
				!passCode ||
				passCode.length < minPasscodeLength
			) {
				console.log(
					"useFrameProcessor (GetWords): Pre-conditions not met on frame. Stopping.",
				)
				onProcessingStop() // This will set captureStarted to "stopped", making isActive false for the stream
				return
			}

			onProcessedImageUpdate(data.processedDataUrl)

			if (data.descriptorsArray && data.descriptorsArray.length > 0) {
				const jsonData: GetterRequest = {
					pass_code: passCode,
					image_code: data.descriptorsArray,
				}
				console.log(
					"useFrameProcessor (GetWords): Sending to backend:",
					jsonData,
				)
				try {
					const response = await axios.post(`${apiUrl}/vTag`, jsonData)
					console.log(
						"useFrameProcessor (GetWords): Words received:",
						response.data.data.words,
					)
					onProcessingSuccess(response.data.data.words) // This typically stops capture
				} catch (error) {
					if (axios.isAxiosError(error) && error.response) {
						if (error.response.status === 422) {
							console.log(
								"useFrameProcessor (GetWords): Received 422 error, continuing processing.",
							)
						} else {
							onProcessingStop() // Stop for other server errors
							const errorMessage = `获取词语失败: ${error.response.status} - ${
								error.response.data?.message || "服务器错误"
							}`
							console.log(
								`useFrameProcessor (GetWords): API Error - Status ${error.response.status}`,
								error.response.data,
							)
							onProcessingError(errorMessage, error.response.data)
						}
					} else {
						const errorMessage =
							"处理或发送数据时发生错误，请检查网络连接或稍后再试。"
						console.log(
							"useFrameProcessor (GetWords): Error sending data:",
							error,
						)
						onProcessingError(errorMessage, error)
						// onProcessingStop(); // Optional: stop processing on any network error
					}
				}
			} else {
				console.log(
					"useFrameProcessor (GetWords): No descriptors found in frame, will try next frame.",
				)
			}
		},
		[
			passCode,
			minPasscodeLength,
			apiUrl,
			onProcessedImageUpdate,
			onProcessingSuccess,
			onProcessingError,
			onProcessingStop,
			webcamRef,
			canvasRef,
		],
	)

	const handleGetWordsStreamError = useCallback(
		(error: unknown) => {
			console.error(
				"useFrameProcessor (GetWords): Error from ORB stream:",
				error,
			)
			onProcessingError("ORB图像处理失败", error)
			// onProcessingStop(); // Optionally stop everything if ORB processing itself fails critically
		},
		[onProcessingError /*, onProcessingStop */],
	)

	useOrbProcessingStream({
		webcamRef,
		canvasRef,
		isActive,
		intervalMs: 1000, // GetWords uses 1000ms
		onFrameProcessed: handleGetWordsFrameProcessed,
		onProcessingError: handleGetWordsStreamError,
	})
}
