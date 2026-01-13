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
  webpack: (config, { isServer, dev, webpack }) => {
    // Enhanced Windows file system fixes
    if (isServer) {
      // Configure watchOptions for Windows compatibility
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
        // Use polling on Windows to avoid file system issues
        poll: process.platform === 'win32' ? 1000 : undefined,
        aggregateTimeout: 300,
      }
      
      // Reduce infrastructure logging to minimize file operations
      config.infrastructureLogging = {
        level: 'error',
      }
      
      // Reduce concurrency to avoid file locks on Windows
      if (process.platform === 'win32') {
        config.parallelism = 1
        // Add file system cache for better Windows performance
        config.cache = {
          type: 'filesystem',
          buildDependencies: {
            config: [__filename],
          },
        }
      }
    }
    
    // Fix for Windows path length issues
    if (process.platform === 'win32') {
      config.output = {
        ...config.output,
        pathinfo: false, // Disable path info to reduce path length
        // Use shorter chunk names on Windows
        chunkFilename: dev 
          ? 'static/chunks/[name].js' 
          : 'static/chunks/[name].[contenthash:8].js',
      }
      
      // Removed DefinePlugin - Next.js manages NEXT_RUNTIME internally
      // No need to manually define it to avoid conflicts
    }
    
    return config
  },
  // Add experimental options for Windows
  experimental: {
    // Reduce file operations during build
    optimizePackageImports: ['lucide-react', 'recharts'],
    // Enable server components external packages
    serverComponentsExternalPackages: [],
  },
  // Disable source maps in production for faster builds on Windows
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
