import cv from "@techstark/opencv-js"

export function processImageWithORB(
	imageSrc: string,
	canvas: HTMLCanvasElement,
) {
	return new Promise<{
		processedDataUrl: string
		descriptorsArray: number[][]
	}>((resolve, reject) => {
		const img = new Image()
		img.src = imageSrc
		img.onload = () => {
			try {
				const src = cv.imread(img)
				const gray = new cv.Mat()
				cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)

				const orb = new cv.ORB()

				const keypoints = new cv.KeyPointVector()
				const descriptors = new cv.Mat()
				orb.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors)

				const dst = new cv.Mat()
				cv.drawKeypoints(src, keypoints, dst)

				cv.imshow(canvas, dst)

				const dataUrl = canvas.toDataURL("image/jpeg")

				const descArray: number[][] = []
				for (let i = 0; i < descriptors.rows; i++) {
					const row: number[] = []
					for (let j = 0; j < descriptors.cols; j++) {
						row.push(descriptors.ucharPtr(i, j)[0])
					}
					descArray.push(row)
				}

				// Clean up
				src.delete()
				gray.delete()
				keypoints.delete()
				descriptors.delete()
				dst.delete()
				orb.delete()

				resolve({ processedDataUrl: dataUrl, descriptorsArray: descArray })
			} catch (error) {
				reject(error)
			}
		}
		img.onerror = () => reject(new Error("Failed to load image"))
	})
}
