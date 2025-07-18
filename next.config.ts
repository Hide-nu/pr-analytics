import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Vercel環境でのファイルシステムアクセスを制限
  serverExternalPackages: [],
  // 静的ファイルとして扱うディレクトリを指定
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },
};

export default nextConfig;
