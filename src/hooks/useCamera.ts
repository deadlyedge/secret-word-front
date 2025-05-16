import { useCallback, useEffect, useState } from "react"

export function useCamera() {
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
		undefined,
	)

	const handleDevices = useCallback((mediaDevices: MediaDeviceInfo[]) => {
		const videoDevices = mediaDevices.filter(
			({ kind }) => kind === "videoinput",
		)
		setDevices(videoDevices)
	}, [])

	useEffect(() => {
		navigator.mediaDevices.enumerateDevices().then(handleDevices)
	}, [handleDevices])

	// Effect to set initial device or update if current selection becomes invalid
	useEffect(() => {
		if (devices.length > 0) {
			const currentDeviceExists = devices.some(
				(d) => d.deviceId === selectedDeviceId,
			)
			if (!selectedDeviceId || !currentDeviceExists) {
				setSelectedDeviceId(devices[0]?.deviceId)
			}
		} else {
			setSelectedDeviceId(undefined) // No devices available, clear selection
		}
	}, [devices, selectedDeviceId])

	return {
		devices,
		deviceId: selectedDeviceId,
		setDeviceId: setSelectedDeviceId,
	}
}
