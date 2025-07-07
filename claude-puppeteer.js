#!/usr/bin/env node

const puppeteer = require('puppeteer-core');
const config = require('./puppeteer-config');
const { spawn } = require('child_process');

// Function to scrape web content
async function scrapeUrl(url) {
    const browser = await puppeteer.launch(config);
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const content = await page.evaluate(() => {
            return {
                title: document.title,
                text: document.body.innerText,
                html: document.documentElement.outerHTML
            };
        });
        
        return content;
    } finally {
        await browser.close();
    }
}

// Function to run Claude with scraped content
async function claudeWithWeb(prompt, urls) {
    console.log('🌐 Fetching web content...');
    
    const webContent = [];
    for (const url of urls) {
        console.log(`   Fetching: ${url}`);
        const content = await scrapeUrl(url);
        webContent.push({
            url,
            title: content.title,
            text: content.text.substring(0, 5000) // Limit text length
        });
    }
    
    // Prepare enhanced prompt
    const enhancedPrompt = `${prompt}\n\nWeb Content:\n${JSON.stringify(webContent, null, 2)}`;
    
    // Run Claude with enhanced prompt
    console.log('🤖 Running Claude...');
    const claude = spawn('claude', [enhancedPrompt], { stdio: 'inherit' });
    
    return new Promise((resolve, reject) => {
        claude.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error(`Claude exited with code ${code}`));
        });
    });
}

// CLI interface
const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: claude-puppeteer <prompt> [url1] [url2] ...');
    process.exit(1);
}

const prompt = args[0];
const urls = args.slice(1);

if (urls.length > 0) {
    claudeWithWeb(prompt, urls).catch(console.error);
} else {
    console.log('No URLs provided. Use regular claude command instead.');
}
