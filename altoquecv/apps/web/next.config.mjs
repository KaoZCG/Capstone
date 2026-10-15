/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	distDir: process.env.NODE_ENV === "development" ? ".next-dev" : (process.env.NEXT_DIST_DIR ?? ".next"),
};

export default nextConfig;