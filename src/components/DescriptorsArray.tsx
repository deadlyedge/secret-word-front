"use client"

import React from "react"

interface DescriptorsArrayProps {
	descriptors: number[][]
}

export default function DescriptorsArray({
	descriptors,
}: DescriptorsArrayProps) {
	if (!descriptors || descriptors.length === 0)
		return <div>No descriptors available.</div>
	return (
		<pre className="max-h-64 overflow-auto p-2 rounded-md">
			<p>Descriptors{JSON.stringify(descriptors)}</p>
			<p>Size: {descriptors.length / 1024} KB</p>
		</pre>
	)
}
