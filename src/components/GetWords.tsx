"use client"

import type { Content } from "@tiptap/react"
import axios from "axios"
// import { CameraIcon, ProjectorIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import Webcam from "react-webcam"
// import { toast } from "sonner"

import { processImageWithORB } from "@/lib/orbProcessor"
import { cn } from "@/lib/utils"

// import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"

import type { GetterRequest } from "@/types"
import { SelectCamera } from "./SelectCamera"
import { Viewer } from "./Viewer"

const MIN_PASSCODE_LENGTH = Number.parseInt(
	process.env.MIN_PASSCODE_LENGTH || "3",
)

export const GetWords = () => {
	const webcamRef = useRef<Webcam>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [captureStarted, setCaptureStarted] = useState<
		"stopped" | "captured" | "processing"
	>("stopped")
	const [processedImage, setProcessedImage] = useState<string>("")
	const [descriptorsArray, setDescriptorsArray] = useState<number[][]>([])

	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [deviceId, setDeviceId] = useState<string | undefined>(undefined)

	const [content, setContent] = useState<string>("")
	const [passCode, setPassCode] = useState<string>("")
	const [inputValue, setInputValue] = useState<string>("")

	const passCodeTimeout = useRef<NodeJS.Timeout | null>(null)
	const processCheckInterval = useRef<NodeJS.Timeout | null>(null)

	const handleDevices = useCallback(
		(mediaDevices: MediaDeviceInfo[]) =>
			setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
		[],
	)

	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null

		const processFrame = async () => {
			if (!webcamRef.current || !canvasRef.current) return
			const imageSrc = webcamRef.current.getScreenshot()
			if (!imageSrc) return

			try {
				const { processedDataUrl, descriptorsArray } =
					await processImageWithORB(imageSrc, canvasRef.current)
				setProcessedImage(processedDataUrl)
				setDescriptorsArray(descriptorsArray)
			} catch (error) {
				console.error("Error processing frame:", error)
			}
		}

		if (captureStarted === "processing") {
			intervalId = setInterval(processFrame, 1000)
		} else if (intervalId) {
			clearInterval(intervalId)
			intervalId = null
		}

		return () => {
			if (intervalId) clearInterval(intervalId)
		}
	}, [captureStarted])

	useEffect(() => {
		navigator.mediaDevices.enumerateDevices().then(handleDevices)
	}, [handleDevices])

	useEffect(() => {
		if (devices.length === 0) return
		setDeviceId(devices[0]?.deviceId)
	}, [devices])

	const handlePassCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault()
		const value = e.target.value
		setInputValue(value)
		if (passCodeTimeout.current) {
			clearTimeout(passCodeTimeout.current)
		}
		passCodeTimeout.current = setTimeout(() => {
			setPassCode(value)
			console.log("passCode updated:", value)
		}, 1000)
	}

	const processCheck = useCallback(async () => {
		if (!descriptorsArray) return
		const jsonData: GetterRequest = {
			pass_code: passCode,
			image_code: descriptorsArray,
		}
		const response = await axios.post("http://localhost:8000/vTag", jsonData)

		console.log("response", response.data)

		if (
			response.data.words &&
			response.data.words !== content &&
			response.data.words !== ""
		) {
			setContent(response.data.words)
		}
	}, [descriptorsArray, passCode, content])

	useEffect(() => {
		if (processCheckInterval.current) {
			clearInterval(processCheckInterval.current)
			processCheckInterval.current = null
		}
		if (passCode.length > MIN_PASSCODE_LENGTH) {
			setCaptureStarted("processing")
			processCheck()
			processCheckInterval.current = setInterval(processCheck, 1000)
		}

		return () => {
			if (processCheckInterval.current) {
				setCaptureStarted("stopped")
				clearInterval(processCheckInterval.current)
				processCheckInterval.current = null
			}
		}
	}, [passCode, processCheck])

	useEffect(() => {
		return () => {
			if (passCodeTimeout.current) {
				clearTimeout(passCodeTimeout.current)
			}
		}
	}, [])

	// const handleSubmit = async () => {
	// 	if (!content || !descriptorsArray) return
	// 	const jsonData: MakerRequest = {
	// 		pass_code: passCode,
	// 		words: content.toString(),
	// 		image_code: descriptorsArray,
	// 	}
	// 	const response = await axios.post("http://localhost:8000/maker", jsonData)
	// 	console.log(response.data)
	// 	toast.info(`Submitted: ${passCode}`)
	// }

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
					{true && <Viewer content={content} />}
				</div>
				<div className="relative w-[70vw] lg:w-full aspect-3/4 rounded-md text-center">
					<canvas ref={canvasRef} style={{ display: "none" }} />
					<Webcam
						audio={false}
						// height={480}
						// width={640}
						screenshotFormat="image/jpeg"
						videoConstraints={{
							deviceId,
							facingMode: "environment",
							aspectRatio: 3 / 4,
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
						{/* {captureStarted !== "processing" ? (
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
						)} */}
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex flex-col items-center">
				{/* <Button
					disabled={!passCode || !content || !descriptorsArray}
					onClick={handleSubmit}
					className="w-[70vw] lg:w-full">
					{passCode && content && descriptorsArray
						? "生成密语"
						: "填写以上三项生成密语"}
				</Button> */}
			</CardFooter>
		</Card>
	)
}
