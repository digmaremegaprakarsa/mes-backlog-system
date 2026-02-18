const path = require("path")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure server tracing includes the monorepo root when deployed on Netlify.
  outputFileTracingRoot: path.join(__dirname, "../..")
}

module.exports = nextConfig
