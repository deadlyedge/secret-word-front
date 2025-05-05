"use client"

import React from "react"

interface ProcessedImageProps {
  imageSrc: string
}

export default function ProcessedImage({ imageSrc }: ProcessedImageProps) {
  if (!imageSrc) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageSrc} alt="Processed" className="rounded-md" />
  )
}
