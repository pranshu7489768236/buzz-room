# Personal Website

A simple, minimal one-page personal site built with Next.js (static export) and Tailwind CSS.

## Editing your content

Almost everything you'll want to change lives in **one file**:

```
lib/content.ts
```

There you can update your intro, skills, work experience, projects, and contact
email — no need to touch the components. Update the `email` field and the
placeholder years/projects when you're ready.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Building

```bash
npm run build
```

This produces a fully static site in the `out/` folder.

## Deployment (GitHub Pages)

Pushing to the `main` branch triggers the workflow in
`.github/workflows/deploy.yml`, which builds the site and deploys it to GitHub
Pages automatically. In the repo, make sure **Settings → Pages → Source** is set
to **GitHub Actions**.
