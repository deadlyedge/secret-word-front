"use client"

import axios from "axios"
// import { CameraIcon, ProjectorIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import Webcam from "react-webcam"
import { toast } from "sonner"

import { processImageWithORB } from "@/lib/orbProcessor"
import { cn } from "@/lib/utils"

import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"

import type { GetterRequest } from "@/types"
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

	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [deviceId, setDeviceId] = useState<string | undefined>(undefined)

	const [content, setContent] = useState<string>("")
	const [passCode, setPassCode] = useState<string>("")
	const [inputValue, setInputValue] = useState<string>("")

	const passCodeTimeout = useRef<NodeJS.Timeout | null>(null)
	// const processCheckInterval = useRef<NodeJS.Timeout | null>(null)

	const handleDevices = useCallback(
		(mediaDevices: MediaDeviceInfo[]) =>
			setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
		[],
	)

	useEffect(() => {
		const handleDeviceChange = () => {
			navigator.mediaDevices.enumerateDevices().then(handleDevices)
		}

		navigator.mediaDevices.ondevicechange = handleDeviceChange

		return () => {
			navigator.mediaDevices.ondevicechange = null
		}
	}, [handleDevices])

	const requestCameraPermission = async () => {
		try {
			await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" }
			})
			await navigator.mediaDevices.enumerateDevices().then(handleDevices)
		} catch (err) {
			console.error("无法获取摄像头权限:", err)
			toast.error("请先允许摄像头权限")
		}
	}

	useEffect(() => {
		if (devices.length === 0) return
		if (!deviceId) {
			// Set only if not already set (e.g., by user selection)
			setDeviceId(devices[0]?.deviceId)
		}
	}, [devices, deviceId])

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

	// Main processing loop effect
	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null

		const beep = () => {
			const audio = new Audio("/audio/beep.mp3")
			audio.play()
		}

		const processFrameAndSend = async () => {
			if (
				!webcamRef.current ||
				!canvasRef.current ||
				!passCode || // Ensure passCode is present
				passCode.length < MIN_PASSCODE_LENGTH // Ensure passCode is still valid
			) {
				console.log(
					"processFrameAndSend: Pre-conditions not met (refs, passcode). Stopping.",
				)
				setCaptureStarted("stopped") // This will lead to interval cleanup
				return
			}

			const imageSrc = webcamRef.current.getScreenshot()
			if (!imageSrc) {
				console.log("processFrameAndSend: No image source.")
				return // Try again on next interval
			}

			try {
				console.log(
					`processFrameAndSend: Processing frame for passCode: ${passCode}`,
				)
				const { processedDataUrl, descriptorsArray: newDescriptorsArray } =
					await processImageWithORB(imageSrc, canvasRef.current)
				setProcessedImage(processedDataUrl) // Update UI with processed image

				if (newDescriptorsArray && newDescriptorsArray.length > 0) {
					const jsonData: GetterRequest = {
						pass_code: passCode, // Use the passCode captured by this effect's closure
						image_code: newDescriptorsArray,
					}
					console.log("processFrameAndSend: Sending to backend:", jsonData)
					const response = await axios.post(`${apiUrl}/vTag`, jsonData)
					console.log(
						"processFrameAndSend: Words received:",
						response.data.data.words,
					)
					beep()
					setContent(response.data.data.words)
					setCaptureStarted("stopped") // Stop processing on successful API call
				} else {
					console.log(
						"processFrameAndSend: No descriptors found, will try next frame.",
					)
				}
			} catch (error) {
				if (axios.isAxiosError(error) && error.response) {
					if (error.response.status === 422) {
						console.log("Received 422 error, continuing processing.")
						// Optionally clear state if 422 means "wrong attempt"
						// setProcessedImage("");
						// setContent("");
					} else {
						// For other server errors (500, 401, 403, etc.), stop processing.
						setCaptureStarted("stopped")
						// Server responded with a non-2xx status code
						console.log(
							`processFrameAndSend: API Error - Status ${error.response.status}`,
							error.response.data,
						)
						toast.error(
							`获取词语失败: ${error.response.status} - ${
								error.response.data?.message || "服务器错误"
							}`,
						)
					}
				} else {
					// Network error or other issue before server response
					console.log(
						"processFrameAndSend: Error processing frame or sending data:",
						error,
					)
					toast.error("处理或发送数据时发生错误，请检查网络连接或稍后再试。")
				}
			}
		}

		if (captureStarted === "processing") {
			console.log("Main processing loop: Starting interval.")
			intervalId = setInterval(processFrameAndSend, 1000) // Adjust interval as needed
		}

		return () => {
			if (intervalId) {
				clearInterval(intervalId)
				console.log("Main processing loop: Interval cleared.")
			}
		}
	}, [captureStarted, passCode])

	useEffect(() => {
		return () => {
			if (passCodeTimeout.current) {
				clearTimeout(passCodeTimeout.current)
			}
		}
	}, [])

	return (
		<Card className="w-full h-fit m-2 lg:w-2/3 lg:h-full lg:mx-auto">
			<CardHeader className="hidden">
				<CardTitle>ORB Feature Detection</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-col lg:flex-row lg:space-x-4 items-center justify-center">
				<div className="w-[70vw] lg:w-full flex flex-col items-center justify-center">
					<Input
						type="text"
						placeholder="2.'天王盖地虎'，你的暗号"
						value={inputValue}
						onChange={handlePassCodeChange}
						className="mb-2"
					/>
					{content && <Viewer content={content} />}
					<Button 
						type="button"
						onClick={requestCameraPermission}
						className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
					>
						请求摄像头权限
					</Button>
				</div>
				<div className="relative w-[70vw] lg:w-full aspect-3/4 rounded-md text-center">
					<canvas ref={canvasRef} style={{ display: "none" }} />
					<Webcam
						audio={false}
						screenshotFormat="image/jpeg"
						videoConstraints={{
							deviceId,
							facingMode: "environment",
							aspectRatio: 3 / 4,
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
