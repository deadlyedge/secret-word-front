"use client"

import type { Content } from "@tiptap/react"
import axios from "axios"
import { CameraIcon, ProjectorIcon } from "lucide-react"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Webcam from "react-webcam"
import { toast } from "sonner"

import { processImageWithORB } from "@/lib/orbProcessor"
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

	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [deviceId, setDeviceId] = useState<string | undefined>(undefined)

	const [content, setContent] = useState<Content>("")
	const [passCode, setPassCode] = useState("")

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
			intervalId = setInterval(processFrame, 500)
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

	useEffect(() => {
		if (content) {
			console.log(content)
		}
		if (descriptorsArray) {
			console.log(descriptorsArray)
		}
	}, [content, descriptorsArray])

	const handleSubmit = async () => {
		if (!content || !descriptorsArray) return
		const jsonData: MakerRequest = {
			pass_code: passCode,
			words: content.toString(),
			image_code: descriptorsArray,
		}

		// send image vector data and secret words to database
		const response = await axios.post(`${apiUrl}/maker`, jsonData)
		console.log(response.data)
		toast.info(`Submitted: ${passCode}`)
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
					disabled={!passCode || !content || !descriptorsArray}
					onClick={handleSubmit}
					className="w-[70vw] lg:w-full">
					{passCode && content && descriptorsArray
						? "生成密语"
						: "填写以上三项生成密语"}
				</Button>
			</CardFooter>
		</Card>
	)
}
