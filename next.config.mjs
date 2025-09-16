/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["covers.openlibrary.org"],
  },
  async rewrites() {
    return [
      {
        source: "/home",
        destination: "/",
      },
      {
        source: "/booksList",
        destination: "/search",
      },
      {
        source: "/loginPage",
        destination: "/login",
      },
      {
        source: "/accountDetails",
        destination: "/account",
      },
      {
        source: "/adminPanel",
        destination: "/admin",
      },
      {
        source: "/adminReviewsList",
        destination: "/admin/reviews",
      },
      {
        source: "/bookDetails/:bookKey",
        destination: "/bookDetails/:bookKey",
      },
    ];
  },
};

export default nextConfig;
