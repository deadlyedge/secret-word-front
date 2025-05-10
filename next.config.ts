import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	/* config options here */
	webpack: (config) => {
		config.resolve.fallback = {
			...config.resolve.fallback,
			fs: false,
			path: false,
			crypto: false,
		}
		return config
	},
	// allowedDevOrigins: ["*", "http://0.0.0.0:3000", "http://localhost:3000"],
}

export default nextConfig
