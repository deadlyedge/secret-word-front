"use client"

import { cn } from "@/lib/utils"
import { ProjectorIcon, CameraIcon } from "lucide-react"
import Webcam from "react-webcam"
import { Button } from "./ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { useCallback, useEffect, useRef, useState } from "react"
import { processImageWithORB } from "@/lib/orbProcessor"
import { SelectCamera } from "./SelectCamera"

export const MakeCard = () => {
	const webcamRef = useRef<Webcam>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [captureStarted, setCaptureStarted] = useState(false)
	const [processedImage, setProcessedImage] = useState<string>("")
	const [descriptorsArray, setDescriptorsArray] = useState<number[][]>([])

	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [deviceId, setDeviceId] = useState<string | undefined>(undefined)

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
		setDeviceId(devices[0]?.deviceId)
	}, [devices])

	const switchCapture = () => setCaptureStarted(!captureStarted)

	return (
		<Card className="w-full h-svh m-4 lg:w-1/2 lg:h-full lg:mx-auto">
			<CardHeader>
				<CardTitle>ORB Feature Detection</CardTitle>
			</CardHeader>

			<CardContent className="">
				<div className="relative w-full h-fit aspect-9/16 rounded-md text-center">
					<canvas ref={canvasRef} style={{ display: "none" }} />
					<Webcam
						audio={false}
						// height={480}
						// width={640}
						screenshotFormat="image/jpeg"
						videoConstraints={{
							deviceId,
							facingMode: "environment",
							aspectRatio: 9 / 16,
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
							<>
								<Button
									onClick={switchCapture}
									size="lg"
									className="mt-2 rounded-full bg-linear-to-tl from-yellow-400 to-green-300 hover:bg-green-600">
									<ProjectorIcon />
									Start processing
								</Button>
							</>
						) : (
							<>
								{/* {devices.map((device, key) => (
							<p key={device.deviceId}>{device.label || `Device ${key + 1}`}</p>
						))} */}
								<Button
									onClick={switchCapture}
									size="lg"
									className="mt-2 rounded-full bg-linear-to-tl from-red-500 to-blue-600 animate-pulse hover:bg-red-600">
									<CameraIcon />
									Stop processing
								</Button>
							</>
						)}
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex flex-col items-center">
				<Textarea
					readOnly
					// defaultValue="Descriptors"
					value={`Size: ${descriptorsArray.length / 1024} KB \n ${JSON.stringify(descriptorsArray)}`}
					className="max-h-24 overflow-auto p-2 rounded-md resize-none"
				/>
			</CardFooter>
		</Card>
	)
}
