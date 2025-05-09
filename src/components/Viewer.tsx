import type { Content } from "@tiptap/react"

import MinimalTiptapViewer from "./minimal-tiptap/minimal-tiptap-viewer"

type ViewerProps = {
	content: Content
}

export const Viewer = ({ content }: ViewerProps) => {
	return (
		<MinimalTiptapViewer
			value={content}
			// onChange={setContent}
			className="w-full max-h-[50vh] overflow-y-auto"
			editorContentClassName="p-2 text-left min-h-64"
			// output="html"
			placeholder="Type your description here..."
			editable={false}
			editorClassName="focus:outline-hidden"
			immediatelyRender={false}
		/>
	)
}
