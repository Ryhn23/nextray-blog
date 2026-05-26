import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const SRC_DIR = './src';
const TEMPLATE_DIR = './templates';
const PUBLIC_DIR = './public';

async function build() {
    // 1. Clean public directory
    await fs.emptyDir(PUBLIC_DIR);

    // 2. Copy assets
    const assetsSrc = path.join(SRC_DIR, 'assets');
    const assetsDest = path.join(PUBLIC_DIR, 'assets');
    if (await fs.pathExists(assetsSrc)) {
        await fs.copy(assetsSrc, assetsDest);
    } else {
        // Create public/assets just in case
        await fs.ensureDir(assetsDest);
    }

    // 3. Read templates
    const layoutTpl = await fs.readFile(path.join(TEMPLATE_DIR, 'layout.html'), 'utf-8');
    const indexTpl = await fs.readFile(path.join(TEMPLATE_DIR, 'index.html'), 'utf-8');
    const pageTpl = await fs.readFile(path.join(TEMPLATE_DIR, 'page.html'), 'utf-8');
    const postTpl = await fs.readFile(path.join(TEMPLATE_DIR, 'post.html'), 'utf-8');

    // 4. Process Pages
    const pagesDir = path.join(SRC_DIR, 'content', 'pages');
    const pages = [];
    if (await fs.pathExists(pagesDir)) {
        const pageFiles = await fs.readdir(pagesDir);
        for (const file of pageFiles) {
            if (file.endsWith('.md')) {
                const contentRaw = await fs.readFile(path.join(pagesDir, file), 'utf-8');
                const parsed = matter(contentRaw);
                const htmlContent = marked.parse(parsed.content);
                const slug = file.replace('.md', '');
                pages.push({
                    slug,
                    title: parsed.data.title || slug,
                    html: htmlContent,
                    data: parsed.data
                });
            }
        }
    }

    // Generate Nav Links HTML
    const navLinksHTML =
        `<li><a href="/" class="nav-link">Home</a></li>\n` +
        pages.map(p => `<li><a href="/${p.slug}.html" class="nav-link">${p.title}</a></li>`).join('\n');

    // Write Pages
    for (const page of pages) {
        let contentHtml = pageTpl.replace('{{content}}', page.html).replace('{{title}}', page.title);
        let finalHtml = layoutTpl
            .replace('{{nav_links}}', navLinksHTML)
            .replace('{{main_content}}', contentHtml)
            .replace('{{page_title}}', `${page.title} - Nextray`);

        await fs.outputFile(path.join(PUBLIC_DIR, `${page.slug}.html`), finalHtml);
    }

    // 5. Process Posts
    const postsDir = path.join(SRC_DIR, 'content', 'posts');
    const posts = [];
    if (await fs.pathExists(postsDir)) {
        const postFiles = await fs.readdir(postsDir);
        for (const file of postFiles) {
            if (file.endsWith('.md')) {
                const contentRaw = await fs.readFile(path.join(postsDir, file), 'utf-8');
                const parsed = matter(contentRaw);
                const htmlContent = marked.parse(parsed.content);
                const slug = file.replace('.md', '');
                posts.push({
                    slug,
                    title: parsed.data.title || slug,
                    date: parsed.data.date || '',
                    description: parsed.data.description || '',
                    html: htmlContent,
                    data: parsed.data
                });
            }
        }
    }

    // Sort posts by date (descending)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Write Posts
    for (const post of posts) {
        let contentHtml = postTpl
            .replace('{{content}}', post.html)
            .replace('{{title}}', post.title)
            .replace('{{date}}', post.date);

        let finalHtml = layoutTpl
            .replace('{{nav_links}}', navLinksHTML)
            .replace('{{main_content}}', contentHtml)
            .replace('{{page_title}}', `${post.title} - Nextray`);

        await fs.outputFile(path.join(PUBLIC_DIR, 'posts', `${post.slug}.html`), finalHtml);
    }

    // 6. Generate Index (Home)
    let postListHTML = '<div class="post-list">';
    for (const post of posts) {
        postListHTML += `
            <article class="post-card">
                <h2><a href="/posts/${post.slug}.html">${post.title}</a></h2>
                <div class="post-meta"><time>${post.date}</time></div>
                <p>${post.description}</p>
                <a href="/posts/${post.slug}.html" class="read-more">Read More &rarr;</a>
            </article>
        `;
    }
    postListHTML += '</div>';
    if (posts.length === 0) {
        postListHTML = '<p>No updates found yet.</p>';
    }

    let indexContentHtml = indexTpl.replace('{{post_list}}', postListHTML);
    let finalIndexHtml = layoutTpl
        .replace('{{nav_links}}', navLinksHTML)
        .replace('{{main_content}}', indexContentHtml)
        .replace('{{page_title}}', `Home - Nextray`);

    await fs.outputFile(path.join(PUBLIC_DIR, 'index.html'), finalIndexHtml);

    console.log('Build completed successfully!');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
