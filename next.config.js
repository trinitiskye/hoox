/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    // `next build` didn't lint at all before (no ESLint config existed, so
    // Next.js silently skipped it). Adding .eslintrc.json made `npm run
    // lint` usable on its own, but it also made `next build` start
    // enforcing lint rules and failing on pre-existing errors elsewhere in
    // the codebase (unescaped quotes/apostrophes in JSX) that have nothing
    // to do with this change. Keeping the build unblocked here preserves
    // the original deploy behavior; run `npm run lint` separately to see
    // and fix those pre-existing issues on their own schedule.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
