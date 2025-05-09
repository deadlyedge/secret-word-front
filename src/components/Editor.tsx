import type { Content } from "@tiptap/react"
// import "../components/minimal-tiptap/styles/index.css"

import { MinimalTiptapEditor } from "./minimal-tiptap"
import { Button } from "./ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog"

type EditorProps = {
	content: Content
	setContent: (content: Content) => void
}

export const Editor = ({ content, setContent }: EditorProps) => {
	return (
		// <MinimalTiptapEditor
		//   value={content}
		//   onChange={setContent}
		//   className="w-full m-2 h-64"
		//   editorContentClassName="p-5"
		//   output="html"
		//   placeholder="Enter your description..."
		//   autofocus={false}
		//   editable={true}
		//   editorClassName="focus:outline-hidden"
		// />
		<Dialog>
			<DialogTrigger asChild >
				<Button variant="outline" className="m-2 w-[70vw] lg:w-full">
					3.Edit your words...
				</Button>
			</DialogTrigger>
			<DialogContent className="w-full h-2/3 flex flex-col justify-center p-1">
				<DialogHeader>
					<DialogTitle className="">3.Say your words...</DialogTitle>
					<DialogDescription className="sr-only">
						Fill in the form below to create a new post.
					</DialogDescription>
					<MinimalTiptapEditor
						value={content}
						onChange={setContent}
						className="w-full max-h-[50vh] overflow-y-auto"
						editorContentClassName="p-2 text-left min-h-64"
						output="html"
						placeholder="Type your description here..."
						editable={true}
						editorClassName="focus:outline-hidden"
						immediatelyRender={false}
					/>
				</DialogHeader>

				<DialogFooter>
					{/* <Button
					type="button"
					className="w-full"
					onClick={() => {
						form.handleSubmit(onSubmit)()
					}}
				>
					Save changes
				</Button> */}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
