"use client"

import type { Content } from "@tiptap/react"
import axios from "axios"
import { CameraIcon, ProjectorIcon } from "lucide-react"
import { Suspense, useCallback, useRef, useState } from "react"
import Webcam from "react-webcam"
import { toast } from "sonner"

import { useCamera } from "@/hooks/useCamera"
import { useOrbProcessingStream } from "@/hooks/useOrbProcessingStream"
import { cn } from "@/lib/utils"

import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"

import type { MakerRequest } from "@/types"
import { Editor } from "./Editor"
import { SelectCamera } from "./SelectCamera"

const apiUrl = process.env.NEXT_PUBLIC_API_URL

export const MakeCard = () => {
	const webcamRef = useRef<Webcam>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [captureStarted, setCaptureStarted] = useState<
		"stopped" | "captured" | "processing"
	>("stopped")
	const [processedImage, setProcessedImage] = useState<string>("")
	const [descriptorsArray, setDescriptorsArray] = useState<number[][]>([])

	const { devices, deviceId, setDeviceId } = useCamera()

	const [content, setContent] = useState<Content>("")
	const [passCode, setPassCode] = useState("")

	const isActiveStream = captureStarted === "processing"

	const handleMakeCardFrameProcessed = useCallback(
		(data: { processedDataUrl: string; descriptorsArray: number[][] }) => {
			setProcessedImage(data.processedDataUrl)
			setDescriptorsArray(data.descriptorsArray)
		},
		[], // setProcessedImage and setDescriptorsArray are stable
	)

	const handleMakeCardStreamError = useCallback((error: unknown) => {
		console.error("MakeCard: Error during ORB processing stream:", error)
		toast.error("图像处理时发生错误")
		// Optionally, stop processing if desired
		// setCaptureStarted("stopped");
	}, [])

	useOrbProcessingStream({
		webcamRef,
		canvasRef,
		isActive: isActiveStream,
		intervalMs: 500, // MakeCard used 500ms
		onFrameProcessed: handleMakeCardFrameProcessed,
		onProcessingError: handleMakeCardStreamError,
	})

	// useEffect(() => {
	// 	// This effect is for logging and can be kept or removed based on debugging needs.
	// 	// It's separate from the stream processing.
	// 	if (content && Object.keys(content).length > 0) {
	// 		// Check if content is not empty
	// 		console.log("Content updated:", JSON.stringify(content))
	// 	}
	// 	if (descriptorsArray && descriptorsArray.length > 0) {
	// 		console.log("Descriptors updated, count:", descriptorsArray.length)
	// 	}
	// }, [content, descriptorsArray])

	// Function to handle form submission
	const handleSubmit = async () => {
		if (
			!passCode ||
			!content ||
			Object.keys(content).length === 0 ||
			!descriptorsArray ||
			descriptorsArray.length === 0
		) {
			toast.error("请确保已捕获图像并填写所有必填字段 (暗号和内容)。")
			return
		}

		const jsonData: MakerRequest = {
			pass_code: passCode,
			words: JSON.stringify(content), // Serialize Tiptap content to JSON string
			image_code: descriptorsArray,
		}

		// send image vector data and secret words to database
		try {
			const response = await axios.post(`${apiUrl}/maker`, jsonData)
			console.log(response.data)
			toast.success(`密语卡 '${passCode}' 已成功生成!`)
			// Reset form state
			setPassCode("")
			setContent({}) // Reset Tiptap content to empty
			setProcessedImage("")
			setDescriptorsArray([])
			setCaptureStarted("stopped")
		} catch (error: unknown) {
			console.error("Error submitting to /maker:", error)
			const errorMsg =
				axios.isAxiosError(error) && error.response
					? `${error.response.status} - ${error.response.data?.message || "服务器错误"}`
					: "未知错误"
			toast.error(`提交失败: ${errorMsg}`)
		}
	}

	return (
		<Card className="w-full m-2 lg:w-1/2 2xl:w-1/3 lg:mx-auto">
			<CardHeader className="hidden">
				<CardTitle>ORB Feature Detection</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-col items-center justify-center gap-2">
				<div className="relative w-full aspect-4/3 rounded-md text-center">
					<canvas ref={canvasRef} style={{ display: "none" }} />
					<Webcam
						audio={false}
						// height={480}
						// width={640}
						screenshotFormat="image/jpeg"
						videoConstraints={{
							deviceId,
							// facingMode: "environment",
							aspectRatio: 4 / 3,
						}}
						ref={webcamRef}
						className={cn(
							"rounded-md w-full absolute top-0 left-0 z-40",
							captureStarted !== "stopped" && "z-0",
						)}
					/>
					<div className={cn("rounded-md w-full")}>
						{processedImage && (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={processedImage}
								alt="Processed"
								className={cn(
									"rounded-md object-cover w-full absolute top-0 left-0 z-0",
									captureStarted !== "stopped" && "z-40",
								)}
							/>
						)}
					</div>
					<div className="absolute top-0 w-full z-50">
						{devices.length > 1 && (
							<SelectCamera devices={devices} setDeviceId={setDeviceId} />
						)}
					</div>
					<div className="absolute bottom-0 w-full mb-2 z-50">
						{captureStarted !== "processing" ? (
							<Button
								onClick={() => setCaptureStarted("processing")}
								size="lg"
								className="mt-2 rounded-full bg-linear-to-tl from-yellow-400 to-green-300 hover:bg-green-600">
								<ProjectorIcon />
								1.开始识别
							</Button>
						) : (
							<Button
								onClick={() => setCaptureStarted("captured")}
								size="lg"
								className="mt-2 rounded-full bg-linear-to-tl from-red-500 to-blue-600 animate-pulse hover:bg-red-600">
								<CameraIcon />
								1.选定图像
							</Button>
						)}
					</div>
				</div>
				<div className="w-full flex flex-col items-center justify-center">
					<Input
						type="text"
						placeholder="2.'天王盖地虎'，你的暗号"
						value={passCode}
						onChange={(e) => setPassCode(e.target.value)}
						className="mt-2"
					/>
					<Suspense fallback={<div>Loading...</div>}>
						<Editor content={content} setContent={setContent} />
					</Suspense>
				</div>
			</CardContent>
			<CardFooter className="flex flex-col items-center">
				<Button
					disabled={
						!passCode ||
						!content ||
						Object.keys(content).length === 0 ||
						descriptorsArray.length === 0 ||
						captureStarted === "processing"
					}
					onClick={handleSubmit}
					className="w-[70vw] lg:w-full">
					{passCode &&
					content &&
					Object.keys(content).length > 0 &&
					descriptorsArray.length > 0 &&
					captureStarted !== "processing"
						? `为 "${passCode}" 生成密语`
						: "填写以上三项生成密语"}
				</Button>
			</CardFooter>
		</Card>
	)
}
