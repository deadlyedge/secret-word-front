"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { HomeIcon } from "lucide-react"

type NavbarItemProps = {
	href: string
	children: React.ReactNode
	isActive?: boolean
}

const NavbarItem = ({ href, children, isActive = false }: NavbarItemProps) => {
	return (
		<Button
			asChild
			variant="ghost"
			className={cn(
				"rounded-full hover:border-white border-2 text-sm",
				isActive &&
					"text-slate-700 bg-white hover:bg-black hover:text-white font-semibold",
			)}>
			<Link href={href}>{children}</Link>
		</Button>
	)
}

const navbarItems = [
	// {
	// 	href: "/",
	// 	children: "Home",
	// },
	{
		href: "/about",
		children: "About",
	},
	{
		href: "/make",
		children: "Make",
	},
	{
		href: "/get",
		children: "Get",
	},
	// {
	// 	href: "/pricing",
	// 	children: "Pricing",
	// },
]

export const Navbar = () => {
	const pathname = usePathname()

	return (
		<nav className="h-20 flex border-b justify-between font-medium">
			<Link href="/" className="px-2 flex items-center">
				<HomeIcon className="mr-2" />
				<span className={cn("text-base font-semibold")}>my.jiaoz.net</span>
			</Link>

			<div className="items-center gap-1 flex">
				{navbarItems.map((item) => (
					<NavbarItem
						key={item.href}
						href={item.href}
						isActive={pathname === item.href}>
						{item.children}
					</NavbarItem>
				))}
			</div>
			{/* 
			<div className="flex lg:hidden items-center justify-center">
				<Button
					variant="ghost"
					className="size-12 border-transparent bg-white"
					onClick={() => {}}>
					<MenuIcon />
				</Button>
			</div> */}
		</nav>
	)
}
