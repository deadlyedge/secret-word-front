import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
} from "./ui/select"

type SelectCameraProps = {
	devices: MediaDeviceInfo[]
	setDeviceId: (deviceId: string) => void
}

export const SelectCamera = ({ devices, setDeviceId }: SelectCameraProps) => {
	return (
		<Select onValueChange={setDeviceId} defaultValue={devices[0]?.deviceId}>
			<SelectTrigger className="">Select Camera</SelectTrigger>
			<SelectContent className="truncate text-left w-[200px]">
				<SelectGroup>
					<SelectLabel>Cameras</SelectLabel>
					{devices.map((device, key) => (
						<SelectItem key={device.deviceId} value={device.deviceId}>
							{device.label || `Device ${key + 1}`}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	)
}
