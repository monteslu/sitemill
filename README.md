# sitemill

[![CI](https://github.com/monteslu/sitemill/actions/workflows/ci.yml/badge.svg)](https://github.com/monteslu/sitemill/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/sitemill.svg)](https://www.npmjs.com/package/sitemill)
[![npm downloads](https://img.shields.io/npm/dm/sitemill.svg)](https://www.npmjs.com/package/sitemill)

A tiny static site generator using EJS templates. No complex build pipelines, no magic. Just pages, partials, and static assets.

## Build a Website (quick)

```bash
npm create sitemill my-site
cd my-site
npm install
npm start
```

You now have a working site at http://localhost:8080 with pages, a blog, and styles ready to customize.

## Build a Website (custom)

Create a project structure:

```
my-site/
├── config.js
├── pages/
│   └── index.ejs
├── partials/
│   └── header.ejs
└── static/
    └── css/
        └── style.css
```

Add your site config:

```js
// config.js
module.exports = {
  title: 'My Site',
};
```

Create a page:

```ejs
<!-- pages/index.ejs -->
<%- include(partials + 'header.ejs', { config }) %>
<h1>Welcome to <%= config.title %></h1>
```

Create a partial:

```ejs
<!-- partials/header.ejs -->
<!doctype html>
<html>
<head>
  <title><%= config.title %></title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
```

Install sitemill:

```bash
npm install sitemill
```

Build your site:

```bash
npx sitemill build
```

Your site is now in the `dist/` folder.

## Project Structure

sitemill expects this layout:

```
your-site/
├── config.js         # Site configuration (optional)
├── pages/            # EJS templates that become HTML pages
│   ├── index.ejs     # becomes /index.html
│   ├── about.ejs     # becomes /about.html
│   └── blog/
│       └── post.ejs  # becomes /blog/post.html
├── partials/         # Reusable template fragments
│   ├── header.ejs
│   └── footer.ejs
├── static/           # Copied directly to output
│   ├── css/
│   ├── js/
│   └── img/
└── dist/             # Generated output (do not edit)
```

All paths are configurable if you need something different.

## Commands

Build your site:

```bash
npx sitemill build
```

Build and start a development server:

```bash
npx sitemill serve
```

The server runs on port 8080 by default. Set the `PORT` environment variable to change it:

```bash
PORT=3000 npx sitemill serve
```

## Adding to package.json

For convenience, add these scripts to your project:

```json
{
  "scripts": {
    "build": "sitemill build",
    "start": "sitemill serve",
    "dev": "sitemill serve & node --watch-path=pages --watch-path=partials --watch-path=static --watch-path=config.js -e 'require(\"sitemill\").build(require(\"./config\"))'"
  },
  "dependencies": {
    "sitemill": "^0.1.0"
  }
}
```

The `dev` script watches for file changes and rebuilds automatically.

## Page Frontmatter

Add metadata to any page using a JSON comment at the start of the file:

```ejs
<%#
{
  "title": "About Us",
  "description": "Learn more about our company"
}
%>
<!doctype html>
<html>
<head>
  <title><%= pageConfig.title %></title>
  <meta name="description" content="<%= pageConfig.description %>">
</head>
<body>
  <h1><%= pageConfig.title %></h1>
</body>
</html>
```

The frontmatter is parsed and available as `pageConfig` in your template.

## Template Variables

Every template has access to these variables:

| Variable | Description |
|----------|-------------|
| `config` | Your site configuration from config.js |
| `pageConfig` | Current page frontmatter plus generated fields |
| `pageConfig.link` | URL path to this page (e.g., `/about.html`) |
| `pageConfig.type` | Page type: `page` or `blog` |
| `pageConfig.title` | Page title (falls back to config.title) |
| `blogs` | Array of all blog posts, sorted by date |
| `partials` | Path to partials directory (for includes) |
| `pages` | Path to pages directory |

## Including Partials

Use EJS includes to share common markup:

```ejs
<%- include(partials + 'header.ejs', { config, pageConfig }) %>

<main>
  <h1><%= pageConfig.title %></h1>
  <p>Page content here.</p>
</main>

<%- include(partials + 'footer.ejs') %>
```

Pass any variables you need to the partial as the second argument.

## Blog Posts

To create a blog, add pages with `type: "blog"` in their frontmatter:

```ejs
<%#
{
  "type": "blog",
  "date": "2025-01-15",
  "title": "My First Post",
  "description": "An introduction to the blog"
}
%>
<!doctype html>
<html>
<head><title><%= pageConfig.title %></title></head>
<body>
  <article>
    <h1><%= pageConfig.title %></h1>
    <time><%= pageConfig.date %></time>
    <p>Post content goes here.</p>
  </article>
</body>
</html>
```

All blog posts are collected into the `blogs` array, sorted by date (newest first). Use this to create a blog index:

```ejs
<h1>Blog</h1>
<ul>
  <% blogs.forEach(post => { %>
    <li>
      <a href="<%= post.config.link %>"><%= post.config.title %></a>
      <time><%= post.config.date %></time>
    </li>
  <% }) %>
</ul>
```

### Draft Posts

Use `type: "blog_paused"` for posts you want to build but exclude from the blogs array:

```ejs
<%#
{
  "type": "blog_paused",
  "date": "2025-02-01",
  "title": "Work in Progress"
}
%>
```

The page will be generated, but it won't appear in blog listings.

## Programmatic Usage

You can also use sitemill as a library:

```js
const sitemill = require('sitemill');

// Build with default options
sitemill.build({ title: 'My Site' });

// Build with custom paths
sitemill.build({ title: 'My Site' }, {
  pagesDir: 'src/pages',
  partialsDir: 'src/partials',
  staticDir: 'public',
  outDir: 'build',
});

// Build and serve
sitemill.serve({ title: 'My Site' }, { port: 3000 });
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `pagesDir` | `pages` | Directory containing EJS page templates |
| `partialsDir` | `partials` | Directory containing partial templates |
| `staticDir` | `static` | Directory of static assets to copy |
| `outDir` | `dist` | Output directory for generated site |
| `cwd` | `process.cwd()` | Base directory for resolving paths |
| `port` | `8080` | Port for development server |

## Deployment

The `dist/` folder contains plain HTML, CSS, and JavaScript. Deploy it anywhere:

- Netlify: Set build command to `npx sitemill build` and publish directory to `dist`
- Vercel: Same as Netlify
- GitHub Pages: Push the `dist/` folder or use GitHub Actions
- Any static host: Just upload the `dist/` folder

## License

MIT
