"use client"

import { cn } from "@/lib/utils"
import { ProjectorIcon, CameraIcon } from "lucide-react"
import Webcam from "react-webcam"
import { Button } from "./ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { useEffect, useRef, useState } from "react"
import { processImageWithORB } from "@/lib/orbProcessor"

// type MakeCardProps = {
// 	canvasRef?: React.RefObject<HTMLCanvasElement | null>
// 	webcamRef?: React.RefObject<Webcam | null>
// 	captureStarted: boolean
// 	descriptorsArray: number[][]
// 	processedImage?: string | null
// 	switchCapture: () => void
// }

// const defaultVideoConstraints = {
// 	width: 640,
// 	height: 480,
// 	facingMode: "user",
// }

export const MakeCard = () => {
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
			intervalId = setInterval(processFrame, 500)
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
		<Card className="w-full m-4 lg:w-1/2 lg:mx-auto">
			<CardHeader>
				<CardTitle>ORB Feature Detection</CardTitle>
			</CardHeader>

			<CardContent className="">
				<div className="relative w-full h-fit aspect-4/3 rounded-md">
					<canvas ref={canvasRef} style={{ display: "none" }} />
					<Webcam
						audio={false}
						// height={480}
						// width={640}
						screenshotFormat="image/jpeg"
						// videoConstraints={defaultVideoConstraints}
						ref={webcamRef}
						className={cn(
							"rounded-md w-full absolute top-0 left-0 z-50",
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
									captureStarted && "z-50",
								)}
							/>
						)}
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex flex-col items-center">
				{captureStarted === false ? (
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
	)
}
