const fse = require('fs-extra');
const path = require('path');
const ejs = require('ejs');

const fsp = fse.promises;

const defaultOptions = {
  pagesDir: 'pages',
  partialsDir: 'partials',
  staticDir: 'static',
  outDir: 'dist',
};

async function walk(dir, fileList = []) {
  const files = await fsp.readdir(dir);
  for (const file of files) {
    const stat = await fsp.stat(path.join(dir, file));
    if (stat.isDirectory()) {
      fileList = await walk(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

function parseFrontmatter(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('<%#')) {
    const endIndex = trimmed.indexOf('%>');
    if (endIndex !== -1) {
      const jsonStr = trimmed.substring(3, endIndex).trim();
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        console.log('Error parsing frontmatter:', e.message);
      }
    }
  }
  return {};
}

async function build(config = {}, options = {}) {
  const startTime = Date.now();
  const opts = { ...defaultOptions, ...options };

  // Resolve paths relative to cwd
  const cwd = opts.cwd || process.cwd();
  const pagesDir = path.resolve(cwd, opts.pagesDir);
  const partialsDir = path.resolve(cwd, opts.partialsDir);
  const staticDir = path.resolve(cwd, opts.staticDir);
  const outDir = path.resolve(cwd, opts.outDir);

  // Clean and setup output directory
  await fse.remove(outDir);
  await fse.ensureDir(outDir);

  // Copy static files
  const copyP = fse.copy(staticDir, outDir).catch(() => {
    // staticDir may not exist, that's okay
  });

  // Walk pages directory
  const allFiles = await walk(pagesDir);

  const fileMap = {};
  let blogs = [];

  // Parse all pages and extract frontmatter
  for (const fileName of allFiles) {
    if (!fileName.endsWith('.ejs')) continue;

    const text = (await fsp.readFile(fileName)).toString();
    const relativePath = path.relative(pagesDir, fileName);
    const outputFilename = path.join(outDir, relativePath.replace('.ejs', '.html'));
    const link = '/' + relativePath.replace('.ejs', '.html').replace(/index\.html$/, '').replace(/\/$/, '');

    const frontmatter = parseFrontmatter(text);
    const pageConfig = {
      link: link || '/',
      type: 'page',
      title: config.title || '',
      ...frontmatter,
    };

    const fObj = { text, fileName, outputFilename, config: pageConfig };
    fileMap[fileName] = fObj;

    if (pageConfig.type === 'blog') {
      blogs.push(fObj);
    }
  }

  // Sort blogs by date (newest first)
  blogs = blogs.sort((a, b) => {
    if (a.config.date > b.config.date) return -1;
    if (a.config.date < b.config.date) return 1;
    return 0;
  });

  // Render all pages
  function render(fObj) {
    const html = ejs.render(fObj.text, {
      config,
      pages: pagesDir + '/',
      partials: partialsDir + '/',
      pageConfig: fObj.config,
      blogs,
    });
    fse.mkdirpSync(path.dirname(fObj.outputFilename));
    return fsp.writeFile(fObj.outputFilename, html);
  }

  const promises = Object.values(fileMap).map(render);
  promises.push(copyP);

  await Promise.all(promises);

  const pageCount = Object.keys(fileMap).length;
  const elapsed = Date.now() - startTime;
  console.log('sitemill:', pageCount, 'pages built in', elapsed + 'ms');

  return { pageCount, elapsed, blogs };
}

async function serve(config = {}, options = {}) {
  const opts = { ...defaultOptions, ...options };
  const cwd = opts.cwd || process.cwd();
  const outDir = path.resolve(cwd, opts.outDir);
  const port = process.env.PORT || opts.port || 8080;

  await build(config, options);

  const httpServer = require('http-server');
  const server = httpServer.createServer({ root: outDir });
  server.listen(port);
  console.log(`sitemill: serving at http://localhost:${port}`);

  return server;
}

module.exports = build;
module.exports.build = build;
module.exports.serve = serve;
module.exports.parseFrontmatter = parseFrontmatter;
