/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      allowedDevOrigins: [
        "9000-firebase-studio-1779459977448.cluster-wurh6gchdjcjmwrw2tqtufvhss.cloudworkstations.dev",
        "localhost:9002"
      ],
      // Add your heaviest third-party libraries here
      optimizePackageImports: ['lucide-react', 'date-fns', 'lodash', 'framer-motion'],
    },
  };
  
  export default nextConfig;
  