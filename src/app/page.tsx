/* eslint-disable @next/next/no-img-element */
"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { processImageWithORB } from "@/lib/orbProcessor"
import Webcam from "react-webcam"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { CameraIcon, ProjectorIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const defaultVideoConstraints = {
	width: 640,
	height: 480,
	facingMode: "user",
}

export default function Home() {
	const webcamRef = useRef<Webcam>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [captureStarted, setCaptureStarted] = useState(false)
	const [processedImage, setProcessedImage] = useState<string>("")
	const [descriptorsArray, setDescriptorsArray] = useState<number[][]>([])

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
			intervalId = setInterval(processFrame, 1000)
		} else if (intervalId) {
			clearInterval(intervalId)
			intervalId = null
		}

		return () => {
			if (intervalId) clearInterval(intervalId)
		}
	}, [captureStarted])

	const switchCapture = () => setCaptureStarted(!captureStarted)

	return (
		<div className="flex flex-col lg:flex-row items-center justify-center min-h-screen">
			<Card className="w-full m-4 lg:w-1/2 lg:mx-auto">
				<CardHeader>
					<CardTitle>ORB Feature Detection</CardTitle>
				</CardHeader>

				<CardContent className="">
					<div className="">
						<canvas ref={canvasRef} style={{ display: "none" }} />
						<Webcam
							audio={false}
							// height={480}
							// width={640}
							screenshotFormat="image/jpeg"
							// videoConstraints={defaultVideoConstraints}
							ref={webcamRef}
							className={cn("rounded-md w-full", captureStarted && "hidden")}
						/>
						<div
							className={cn(
								"rounded-md w-full",
								!captureStarted && "hidden",
							)}>
							{processedImage && (
								<img
									src={processedImage}
									alt="Processed"
									className="rounded-md object-cover w-full"
								/>
							)}
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col items-center">
					{descriptorsArray.length === 0 ? (
						<>
							<Button onClick={switchCapture} className="mt-2">
								<ProjectorIcon />
								Start processing
							</Button>
						</>
					) : (
						<>
							<Textarea
								readOnly
								// defaultValue="Descriptors"
								value={`Size: ${descriptorsArray.length / 1024} KB \n ${JSON.stringify(descriptorsArray)}`}
								className="max-h-24 overflow-auto p-2 rounded-md"
							/>
							<Button onClick={switchCapture} className="mt-2">
								<CameraIcon />
								Stop processing
							</Button>
						</>
					)}
				</CardFooter>
			</Card>
			{/* <Card className="w-full m-4 lg:w-1/2 lg:mx-auto">
				<CardHeader>
					<CardTitle>ORB Feature Detection</CardTitle>
				</CardHeader>
				<CardContent>
					<canvas ref={canvasRef} style={{ display: "none" }} />
					<div className="mt-4">
						{processedImage && (
							<img
								src={processedImage}
								alt="Processed"
								className="rounded-md object-cover w-full"
							/>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex flex-col items-center">
					<Textarea
						readOnly
						// defaultValue="Descriptors"
						value={`Size: ${descriptorsArray.length / 1024} KB \n ${JSON.stringify(descriptorsArray)}`}
						className="max-h-24 overflow-auto p-2 rounded-md"
					/>

					<Button onClick={switchCapture} className="mt-2">
						<CameraIcon />
						Use this image
					</Button>
				</CardFooter>
			</Card> */}
		</div>
	)
}
