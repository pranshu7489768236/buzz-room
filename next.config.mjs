// When deploying to a GitHub *project* page the site lives at
// https://<user>.github.io/<repo>/, so assets need to be prefixed with the repo
// name. The deploy workflow sets PAGES_BASE_PATH to "/<repo>"; locally it's empty
// so `npm run dev` still works at the root.
const basePath = process.env.PAGES_BASE_PATH || ""

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a fully static site in the `out/` folder (great for GitHub Pages).
  output: "export",

  // GitHub Pages serves static files, so Next's image optimizer must be off.
  images: { unoptimized: true },

  // Emit `about/index.html` instead of `about.html` so static hosts resolve routes cleanly.
  trailingSlash: true,

  basePath,
  assetPrefix: basePath || undefined,
}

export default nextConfig
