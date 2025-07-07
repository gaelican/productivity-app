const puppeteer = require('puppeteer-core');

const config = {
    // Termux-specific Chromium configuration
    executablePath: '',
    
    // Required args for Termux environment
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--user-data-dir=/data/data/com.termux/files/home/.chromium-data'
    ],
    
    // Headless mode for CLI usage
    headless: 'new',
    
    // Termux-specific settings
    ignoreDefaultArgs: ['--disable-extensions'],
    defaultViewport: { width: 1280, height: 720 }
};

module.exports = config;
