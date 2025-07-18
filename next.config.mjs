/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export', // 开启静态导出功能
  distDir: 'out',   // 可选配置，用于指定输出目
  
}

export default nextConfig
