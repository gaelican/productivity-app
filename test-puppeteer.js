const puppeteer = require('puppeteer-core');
const config = require('./puppeteer-config');

async function testPuppeteer() {
    console.log('🧪 Testing Puppeteer setup...\n');
    
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch(config);
        
        console.log('✅ Browser launched successfully');
        
        const page = await browser.newPage();
        console.log('✅ New page created');
        
        console.log('Navigating to example.com...');
        await page.goto('https://example.com', { waitUntil: 'networkidle2' });
        
        const title = await page.title();
        console.log('✅ Page loaded. Title:', title);
        
        await browser.close();
        console.log('✅ Browser closed successfully');
        
        console.log('\n✅ Puppeteer is working correctly!');
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

testPuppeteer();
