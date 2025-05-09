import "./styles/index.css"

import { cn } from "@/lib/utils"
import type { Content } from "@tiptap/react"
import { EditorContent } from "@tiptap/react"
import { MeasuredContainer } from "./components/measured-container"
import type { UseMinimalTiptapEditorProps } from "./hooks/use-minimal-tiptap"
import { useMinimalTiptapEditor } from "./hooks/use-minimal-tiptap"

export interface MinimalTiptapViewerProps
	extends Omit<UseMinimalTiptapEditorProps, "onUpdate"> {
	value?: Content
	onChange?: (value: Content) => void
	className?: string
	editorContentClassName?: string
}

export const MinimalTiptapViewer = ({
	value,
	onChange,
	className,
	editorContentClassName,
	...props
}: MinimalTiptapViewerProps) => {
	const editor = useMinimalTiptapEditor({
		value,
		onUpdate: onChange,
		...props,
	})

	if (!editor) {
		return null
	}

	return (
		<MeasuredContainer
			as="div"
			name="editor"
			// onCloseAutoFocus={(event: FocusEvent<HTMLDivElement>) => event.preventDefault()}
			className={cn(
				"border-input focus-within:border-primary min-data-[orientation=vertical]:h-72 flex h-auto w-full flex-col rounded-md border shadow-xs",
				className,
			)}>
			<EditorContent
				editor={editor}
				className={cn(
					"minimal-tiptap-editor overflow-y-auto",
					editorContentClassName,
				)}
			/>
		</MeasuredContainer>
	)
}

MinimalTiptapViewer.displayName = "MinimalTiptapViewer"

export default MinimalTiptapViewer
