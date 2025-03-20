import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: ['d7oowangxmgqz.cloudfront.net'],
    },
    async redirects() {
        return [
            {
                source: '/:path*',
                has: [
                    {
                        type: 'host',
                        value: 'www.score.law',
                    },
                ],
                destination: 'https://score.law/:path*',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
