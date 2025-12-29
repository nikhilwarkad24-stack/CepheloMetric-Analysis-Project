import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://*.firebaseio.com https://*.firebaseapp.com https://www.google-analytics.com https://www.googletagmanager.com https://apis.google.com https://identitytoolkit.googleapis.com; img-src 'self' data: https: https://www.google-analytics.com; frame-src 'self' https://accounts.google.com; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
