"use client"

import "@mdxeditor/editor/style.css"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { ProjectorIcon, CameraIcon } from "lucide-react"
import Webcam from "react-webcam"

import { cn } from "@/lib/utils"
import { processImageWithORB } from "@/lib/orbProcessor"

import { Button } from "./ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card"

import { SelectCamera } from "./SelectCamera"
import { Editor } from "./Editor"
import axios from "axios"
import type { MakerRequest } from "@/types"
import { toast } from "sonner"
import { Input } from "./ui/input"

export const MakeCard = () => {
	const webcamRef = useRef<Webcam>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [captureStarted, setCaptureStarted] = useState(false)
	const [processedImage, setProcessedImage] = useState<string>("")
	const [descriptorsArray, setDescriptorsArray] = useState<number[][]>([])

	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [deviceId, setDeviceId] = useState<string | undefined>(undefined)

	const [content, setContent] = useState("")
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

		if (captureStarted) {
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

	const switchCapture = () => setCaptureStarted(!captureStarted)

	const handleSubmit = async () => {
		if (!content || !descriptorsArray) return
		const jsonData: MakerRequest = {
			pass_code: passCode,
			words: content,
			image_code: descriptorsArray,
		}
		const response = await axios.post("http://localhost:8000/maker", jsonData)
		console.log(response.data)
		toast.info(`Submitted: ${JSON.stringify(response.data)}`)
	}

	return (
		<Card className="w-full h-fit m-2 lg:w-2/3 lg:h-full lg:mx-auto">
			<CardHeader className="hidden">
				<CardTitle>ORB Feature Detection</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-col lg:flex-row lg:space-x-4 items-center justify-center">
				<div className="relative w-[60vw] lg:w-full aspect-3/4 rounded-md text-center">
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
							captureStarted && "z-0",
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
									captureStarted && "z-40",
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
						{captureStarted === false ? (
							<Button
								onClick={switchCapture}
								size="lg"
								className="mt-2 rounded-full bg-linear-to-tl from-yellow-400 to-green-300 hover:bg-green-600">
								<ProjectorIcon />
								开始识别
							</Button>
						) : (
							<Button
								onClick={switchCapture}
								size="lg"
								className="mt-2 rounded-full bg-linear-to-tl from-red-500 to-blue-600 animate-pulse hover:bg-red-600">
								<CameraIcon />
								Use this descriptor
							</Button>
						)}
					</div>
				</div>
				<div className="w-full flex flex-col items-center justify-center">
					<Input
						type="text"
						placeholder="Enter pass code"
						value={passCode}
						onChange={(e) => setPassCode(e.target.value)}
					/>
					<Suspense fallback={<div>Loading...</div>}>
						{/* <ForwardRefEditor
						markdown={markdown}
						onChange={setMarkdown}
						ref={editorRef}
					/> */}
						<Editor content={content} setContent={setContent} />
					</Suspense>
				</div>
			</CardContent>
			<CardFooter className="flex flex-col items-center">
				<Button onClick={handleSubmit}>Submit</Button>
			</CardFooter>
		</Card>
	)
}
