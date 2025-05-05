"use client"

import React, { forwardRef } from "react"
import Webcam from "react-webcam"

interface VideoStreamProps {
	videoConstraints?: MediaTrackConstraints
}

const VideoStream = forwardRef<Webcam, VideoStreamProps>((props, ref) => {
	const defaultVideoConstraints = {
		width: 640,
		height: 480,
		facingMode: "user",
	}

	const videoConstraints = props.videoConstraints || defaultVideoConstraints

	return (
		<Webcam
			audio={false}
			height={480}
			width={640}
			screenshotFormat="image/jpeg"
			videoConstraints={videoConstraints}
			ref={ref}
		/>
	)
})

VideoStream.displayName = "VideoStream"

export default VideoStream
