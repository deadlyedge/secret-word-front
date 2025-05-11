import { cn } from "@/lib/utils"
import Link from "next/link"

export const Footer = () => {
	return (
		<footer className="border-t font-medium">
			<div className="max-w-(--breakpoing-xl) mx-auto flex items-center gap-2 h-full p-4 lg:px-8">
				<p>
					&copy; 2025.{" "}
					<Link href="/">
						<span className={cn("font-semibold")}>my.jiaoz.net</span>
					</Link>{" "}
					all rights reserved.
				</p>
			</div>
		</footer>
	)
}
