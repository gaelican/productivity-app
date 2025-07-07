const puppeteer = require('puppeteer-core');
const config = require('./puppeteer-config');
const fs = require('fs').promises;

async function fetchEASLogs(buildId) {
    const browser = await puppeteer.launch(config);
    
    try {
        const page = await browser.newPage();
        
        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        const url = `https://expo.dev/accounts/gaelican/projects/productivity-app/builds/${buildId}`;
        console.log(`📥 Fetching logs from: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Wait for logs to load
        await page.waitForSelector('pre', { timeout: 30000 }).catch(() => {
            console.log('⚠️ No <pre> element found, trying alternative selectors...');
        });
        
        // Try multiple selectors for log content
        const logSelectors = [
            'pre',
            'code',
            '[data-testid="build-logs"]',
            '.logs-container',
            'div[class*="log"]',
            'div[class*="Log"]'
        ];
        
        let logs = null;
        for (const selector of logSelectors) {
            logs = await page.$eval(selector, el => el.textContent).catch(() => null);
            if (logs) {
                console.log(`✅ Found logs using selector: ${selector}`);
                break;
            }
        }
        
        if (!logs) {
            // Try to get all text content
            logs = await page.evaluate(() => document.body.innerText);
        }
        
        // Save logs
        const filename = `eas_logs_${buildId}.txt`;
        await fs.writeFile(filename, logs);
        console.log(`✅ Logs saved to: ${filename}`);
        
        // Extract error patterns
        const errorPatterns = [
            /FAILURE: Build failed/,
            /Error: .*/,
            /Could not .*/,
            /settings\.gradle.*line \d+/,
            /build\.gradle.*line \d+/,
            /> .*/
        ];
        
        console.log('\n🔍 Error Analysis:');
        errorPatterns.forEach(pattern => {
            const matches = logs.match(new RegExp(pattern, 'gi'));
            if (matches) {
                matches.forEach(match => console.log(`   • ${match}`));
            }
        });
        
        return logs;
    } catch (error) {
        console.error('❌ Error fetching logs:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// CLI usage
if (require.main === module) {
    const buildId = process.argv[2];
    if (!buildId) {
        console.error('Usage: node fetch-eas-logs-puppeteer.js <build-id>');
        process.exit(1);
    }
    
    fetchEASLogs(buildId)
        .then(() => console.log('\n✅ Done!'))
        .catch(err => {
            console.error('Failed:', err);
            process.exit(1);
        });
}

module.exports = fetchEASLogs;
