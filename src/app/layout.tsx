import type { Metadata } from "next"
import { Noto_Serif } from "next/font/google"
import "./globals.css"

import { Navbar } from "@/components/Navbar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const notoSerif = Noto_Serif({
	subsets: ["latin"],
	variable: "--font-noto-serif",
	weight: ["300", "700"],
})

export const metadata: Metadata = {
	title: "密语饺子",
	description: "Shouting into the void",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<body
				className={`${notoSerif.className} dark antialiased h-screen overflow-hidden p-1`}>
				<Navbar />
				<TooltipProvider>{children}</TooltipProvider>
				<Toaster duration={2000} />
			</body>
		</html>
	)
}
