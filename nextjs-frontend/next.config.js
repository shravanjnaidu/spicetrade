/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy all /api/* requests to the Flask backend
  async rewrites() {
    // Use 127.0.0.1 explicitly — Node resolves "localhost" to ::1 (IPv6) first
    // on modern systems, but Flask binds IPv4 only, causing ECONNREFUSED on ::1.
    // Flask/gunicorn runs on port 3000 by default (see gunicorn.conf.py).
    const backendUrl = process.env.FLASK_API_URL || "http://127.0.0.1:3000";
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
