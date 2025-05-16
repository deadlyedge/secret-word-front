"use client"

// import { CameraIcon, ProjectorIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import Webcam from "react-webcam"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"

import { useCamera } from "@/hooks/useCamera"
import { useFrameProcessor } from "@/hooks/useFrameProcessor"
import { SelectCamera } from "./SelectCamera"
import { Viewer } from "./Viewer"

const MIN_PASSCODE_LENGTH = Number.parseInt(
	process.env.MIN_PASSCODE_LENGTH || "4",
)
const apiUrl = process.env.NEXT_PUBLIC_API_URL

export const GetWords = () => {
	const webcamRef = useRef<Webcam>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [captureStarted, setCaptureStarted] = useState<
		"stopped" | "processing"
	>("stopped")
	const [processedImage, setProcessedImage] = useState<string>("")
	// const [descriptorsArray, setDescriptorsArray] = useState<number[][]>([])
	const { devices, deviceId, setDeviceId } = useCamera()
	const [content, setContent] = useState<string>("")
	const [passCode, setPassCode] = useState<string>("")
	const [inputValue, setInputValue] = useState<string>("")

	const passCodeTimeout = useRef<NodeJS.Timeout | null>(null)
	// const processCheckInterval = useRef<NodeJS.Timeout | null>(null)

	const handlePassCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault()
		setContent("") // Clear previous content
		const value = e.target.value
		setInputValue(value)
		if (passCodeTimeout.current) {
			clearTimeout(passCodeTimeout.current)
		}
		passCodeTimeout.current = setTimeout(() => {
			setPassCode(value)
			console.log("Debounced passCode updated:", value)
		}, 1000)
	}

	useEffect(() => {
		if (passCode.length >= MIN_PASSCODE_LENGTH) {
			setContent("") // Clear previous content
			setCaptureStarted("processing")
			console.log("Passcode valid, starting processing.")
		} else {
			setCaptureStarted("stopped")
			console.log("Passcode invalid or too short, stopping processing.")
		}
	}, [passCode])

	const handleProcessingSuccess = useCallback((words: string) => {
		const audio = new Audio("/audio/beep.mp3")
		audio.play().catch((err) => console.error("Error playing beep:", err))
		setContent(words)
		setCaptureStarted("stopped") // Stop processing on successful API call
	}, []) // Dependencies setContent, setCaptureStarted are stable from useState

	const handleProcessingStop = useCallback(() => {
		setCaptureStarted("stopped")
	}, []) // Dependency setCaptureStarted is stable

	const handleProcessedImageUpdate = useCallback((dataUrl: string) => {
		setProcessedImage(dataUrl)
	}, []) // Dependency setProcessedImage is stable

	const handleProcessingError = useCallback((message: string) => {
		toast.error(message)
	}, []) // Dependency toast.error is stable

	useFrameProcessor({
		webcamRef,
		canvasRef,
		passCode,
		apiUrl,
		minPasscodeLength: MIN_PASSCODE_LENGTH,
		captureStarted,
		onProcessingSuccess: handleProcessingSuccess,
		onProcessingStop: handleProcessingStop,
		onProcessedImageUpdate: handleProcessedImageUpdate,
		onProcessingError: handleProcessingError,
	})

	useEffect(() => {
		return () => {
			if (passCodeTimeout.current) {
				clearTimeout(passCodeTimeout.current)
			}
		}
	}, [])

	return (
		<Card className="w-full m-2 lg:w-1/2 2xl:w-1/3 lg:mx-auto">
			<CardHeader className="hidden">
				<CardTitle>ORB Feature Detection</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-col items-center justify-center gap-2">
				<div className="w-full flex flex-col items-center justify-center">
					<Input
						type="text"
						placeholder="2.'天王盖地虎'，你的暗号"
						value={inputValue}
						onChange={handlePassCodeChange}
						className="mb-2"
					/>
					{content && <Viewer content={content} />}
					{/* <Button 
						type="button"
						onClick={requestCameraPermission}
						className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
					>
						请求摄像头权限
					</Button> */}
				</div>
				<div className="relative w-full aspect-4/3 rounded-md text-center">
					<canvas ref={canvasRef} style={{ display: "none" }} />
					<Webcam
						audio={false}
						screenshotFormat="image/jpeg"
						videoConstraints={{
							deviceId,
							facingMode: "environment",
							aspectRatio: 4 / 3,
						}}
						ref={webcamRef}
						className={cn(
							"rounded-md w-full absolute top-0 left-0 z-40",
							captureStarted === "processing" && "z-0",
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
									captureStarted === "processing" && "z-40",
								)}
							/>
						)}
					</div>
					<div className="absolute top-0 w-full z-50">
						{devices.length > 1 && (
							<SelectCamera devices={devices} setDeviceId={setDeviceId} />
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
