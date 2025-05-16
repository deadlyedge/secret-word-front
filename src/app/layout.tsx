import type { Metadata } from "next"
import { Noto_Serif } from "next/font/google"
import "./globals.css"

import { Footer } from "@/components/Footer"
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
			<body className={`${notoSerif.className} dark antialiased h-screen p-1`}>
				<Navbar />
				<TooltipProvider>{children}</TooltipProvider>
				<Toaster duration={2000} />
				<Footer />
			</body>
		</html>
	)
}
