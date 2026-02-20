import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  transpilePackages: ['@mui/icons-material', '@mui/material', '@mui/x-data-grid'],
  experimental: {
    optimizePackageImports: ['@mui/icons-material', '@mui/material'],
  },
};

export default nextConfig;
