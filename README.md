# Nextray Blog

A custom, lightweight Static Site Generator (SSG) designed for Cloudflare Pages. This project features a bespoke native commenting and reaction system powered by Cloudflare Workers and KV storage, offering a premium, privacy-first alternative to third-party commenting widgets.

## Features

* **Custom Static Site Generation**: Fast, markdown-based content management tailored for Cloudflare Pages.
* **Native Commenting System**: Fully threaded comments and replies with an ultra-compact UI.
* **Interactive Reactions**: Slack/GitHub-style emoji reaction picker for both posts and individual comments.
* **Secure Author Badges**: Built-in backend verification to securely display author badges without exposing passcodes.
* **Seamless Navigation**: PJAX integration for smooth, app-like page transitions without full reloads.
* **Modern UI**: A beautiful, responsive design utilizing light glassmorphism and high-contrast typography.
* **Integrated Audio Player**: Minimalist persistent background audio player.

## Project Structure

* `src/`: Contains your raw markdown content (`posts/`, `pages/`) and static assets (`css/`, `js/`, `img/`).
* `templates/`: HTML templates for rendering the layouts.
* `public/`: The generated static output directory (ignored by git, served to the public).
* `cloudflare-worker.js`: The backend API handling comments and reactions using Cloudflare KV. (Note: This file is intentionally excluded from version control to keep backend logic and passcodes private).
* `build.js`: The custom SSG build script.

## Getting Started

### Prerequisites

* Node.js (v18 or higher recommended)
* npm or yarn

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Development

To start the local development server with live-reloading:

```bash
npm run dev
```

This will run the build script in watch mode and serve the site locally at `http://localhost:3000`.

### Building for Production

To generate the static files into the `public/` directory:

```bash
npm run build
```
## Deployment

1. **Frontend**: Connect your GitHub repository to Cloudflare Pages and set the build command to `npm run build` and the output directory to `public`.
2. **Backend**: Since `cloudflare-worker.js` is excluded from this repository for privacy, deploy the worker code manually via the Cloudflare dashboard or locally using Wrangler. Ensure you have a KV namespace bound to the variable `COMMENTS_KV`.

## License

MIT License
