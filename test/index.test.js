const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fse = require('fs-extra');

const tinyssg = require('../index');

const fixturesDir = path.join(__dirname, 'fixtures');
const distDir = path.join(fixturesDir, 'dist');

const testConfig = { title: 'Test Site' };
const testOptions = {
  cwd: fixturesDir,
  pagesDir: 'pages',
  partialsDir: 'partials',
  staticDir: 'static',
  outDir: 'dist',
};

describe('tinyssg', async () => {
  // Clean up before tests
  await fse.remove(distDir);

  test('build() returns correct page count', async () => {
    const result = await tinyssg.build(testConfig, testOptions);
    assert.strictEqual(result.pageCount, 5);
  });

  test('build() returns elapsed time', async () => {
    const result = await tinyssg.build(testConfig, testOptions);
    assert.strictEqual(typeof result.elapsed, 'number');
    assert.ok(result.elapsed >= 0);
  });

  test('build() returns sorted blogs array', async () => {
    const result = await tinyssg.build(testConfig, testOptions);
    assert.strictEqual(result.blogs.length, 2);
    // Should be sorted newest first
    assert.strictEqual(result.blogs[0].config.title, 'Second Post');
    assert.strictEqual(result.blogs[1].config.title, 'First Post');
  });

  test('build() excludes blog_paused from blogs array', async () => {
    const result = await tinyssg.build(testConfig, testOptions);
    const titles = result.blogs.map(b => b.config.title);
    assert.ok(!titles.includes('Draft Post'));
  });

  test('build() creates output directory', async () => {
    await tinyssg.build(testConfig, testOptions);
    const exists = await fse.pathExists(distDir);
    assert.ok(exists);
  });

  test('build() generates HTML files', async () => {
    await tinyssg.build(testConfig, testOptions);
    const indexExists = await fse.pathExists(path.join(distDir, 'index.html'));
    const aboutExists = await fse.pathExists(path.join(distDir, 'about.html'));
    assert.ok(indexExists, 'index.html should exist');
    assert.ok(aboutExists, 'about.html should exist');
  });

  test('build() generates nested HTML files', async () => {
    await tinyssg.build(testConfig, testOptions);
    const postExists = await fse.pathExists(path.join(distDir, 'blog', 'post-one.html'));
    assert.ok(postExists, 'blog/post-one.html should exist');
  });

  test('build() copies static files', async () => {
    await tinyssg.build(testConfig, testOptions);
    const cssExists = await fse.pathExists(path.join(distDir, 'css', 'style.css'));
    assert.ok(cssExists, 'css/style.css should exist');
  });

  test('build() renders EJS with config', async () => {
    await tinyssg.build(testConfig, testOptions);
    const html = await fse.readFile(path.join(distDir, 'index.html'), 'utf8');
    assert.ok(html.includes('Test Site'), 'should contain site title');
  });

  test('build() renders partials', async () => {
    await tinyssg.build(testConfig, testOptions);
    const html = await fse.readFile(path.join(distDir, 'index.html'), 'utf8');
    assert.ok(html.includes('<header>'), 'should contain header partial');
    assert.ok(html.includes('<nav>Test Site</nav>'), 'should render nav with config');
  });

  test('build() sets pageConfig.link correctly', async () => {
    await tinyssg.build(testConfig, testOptions);
    const html = await fse.readFile(path.join(distDir, 'about.html'), 'utf8');
    assert.ok(html.includes('Link: /about.html'), 'should have correct link');
  });

  test('blogs array is available in templates', async () => {
    await tinyssg.build(testConfig, testOptions);
    const html = await fse.readFile(path.join(distDir, 'blog', 'post-two.html'), 'utf8');
    assert.ok(html.includes('Total blogs: 2'), 'should have access to blogs array');
  });
});

describe('parseFrontmatter', () => {
  test('parses valid JSON frontmatter', () => {
    const text = '<%# { "title": "Hello" } %>\n<h1>Content</h1>';
    const result = tinyssg.parseFrontmatter(text);
    assert.deepStrictEqual(result, { title: 'Hello' });
  });

  test('returns empty object for no frontmatter', () => {
    const text = '<h1>No frontmatter</h1>';
    const result = tinyssg.parseFrontmatter(text);
    assert.deepStrictEqual(result, {});
  });

  test('returns empty object for invalid JSON', () => {
    const text = '<%# { invalid json } %>\n<h1>Content</h1>';
    const result = tinyssg.parseFrontmatter(text);
    assert.deepStrictEqual(result, {});
  });

  test('handles multiline frontmatter', () => {
    const text = `<%#
{
  "title": "Test",
  "date": "2025-01-01"
}
%>
<h1>Content</h1>`;
    const result = tinyssg.parseFrontmatter(text);
    assert.deepStrictEqual(result, { title: 'Test', date: '2025-01-01' });
  });
});

describe('serve', () => {
  test('serve() builds and returns server', async () => {
    const server = await tinyssg.serve(testConfig, { ...testOptions, port: 9999 });
    assert.ok(server, 'should return server instance');
    // http-server wraps node http server
    server.close();
    // Give it a moment to close
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
});
