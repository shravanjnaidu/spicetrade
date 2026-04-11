/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy all /api/* requests to the Flask backend
  async rewrites() {
    const backendUrl = process.env.FLASK_API_URL || "http://localhost:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
      {
        source: "/logos/:path*",
        destination: `${backendUrl}/logos/:path*`,
      },
      {
        source: "/banners/:path*",
        destination: `${backendUrl}/banners/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
    unoptimized: true,
  },
};

module.exports = nextConfig;
