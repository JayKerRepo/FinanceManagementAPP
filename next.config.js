/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  webpack: (config, { isServer, dev }) => {
    // Enhanced Windows file system fixes
    if (isServer) {
      // Configure watchOptions for Windows compatibility
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
        // Use polling on Windows to avoid file system issues
        poll: process.platform === 'win32' ? 1000 : undefined,
      }
      
      // Reduce infrastructure logging to minimize file operations
      config.infrastructureLogging = {
        level: 'error',
      }
      
      // Reduce concurrency to avoid file locks on Windows
      if (process.platform === 'win32') {
        config.parallelism = 1
      }
    }
    
    // Fix for Windows path length issues
    if (process.platform === 'win32') {
      config.output = {
        ...config.output,
        pathinfo: false, // Disable path info to reduce path length
      }
    }
    
    return config
  },
  // Add experimental options for Windows
  experimental: {
    // Reduce file operations during build
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}

module.exports = nextConfig
