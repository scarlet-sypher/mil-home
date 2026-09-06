/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hides the floating "N" dev-tools indicator badge shown in `next dev`.
  // Dev-only either way — never renders in a production build.
  devIndicators: false,
  images: {
    // Next's image optimizer caches resized images under .next/cache/images inside
    // {app} (C:\Program Files\rms-home in the packaged build) -- not writable by the
    // normal, non-elevated user this app actually runs as (same class of bug the
    // heartbeat file hit). There's also no real benefit to optimizing images for a
    // single local user on localhost, so this turns the whole feature off rather than
    // trying to relocate its cache directory.
    unoptimized: true,
  },
};

module.exports = nextConfig;
