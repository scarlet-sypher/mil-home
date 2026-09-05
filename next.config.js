/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hides the floating "N" dev-tools indicator badge shown in `next dev`.
  // Dev-only either way — never renders in a production build.
  devIndicators: false,
};

module.exports = nextConfig;
