import { useMemo, useRef } from "react"

import type { DeepPartial } from "jodit/esm/types"
import type { Config } from "jodit/esm/config"

import dynamic from "next/dynamic"
const JoditEditor = dynamic(() => import("jodit-react"), {
	ssr: false,
})

type EditorProps = {
	content: string
	setContent: (content: string) => void
}

export const Editor = ({ content, setContent }: EditorProps) => {
	const editor = useRef(null)

	const config: DeepPartial<Config> = useMemo(
		() => ({
			readonly: false, // all options from https://xdsoft.net/jodit/docs/,
			theme: "dark",
			toolbarButtonSize: "small",
			placeholder: "Write something awesome...",
			uploader: {
				insertImageAsBase64URI: true,
			},
			buttonsXS: [
				"bold",
				"italic",
				"underline",
				"paragraph",
				"image",
				"video",
				"link",
				"undo",
				"redo",
				"preview",
			],
			height: 300,
			width: "100%",
		}),
		[],
	)

	return (
		<JoditEditor
			ref={editor}
			value={content}
			config={config}
			tabIndex={0} // tabIndex of textarea
			onBlur={(newContent) => setContent(newContent)} // preferred to use only this option to update the content for performance reasons
			// onChange={(newContent) => {}}
			className="m-2"
		/>
	)
}
