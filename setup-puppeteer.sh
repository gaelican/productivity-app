#!/bin/bash
# Setup Puppeteer for Claude Code CLI in Termux

echo "🚀 Setting up Puppeteer for Claude Code CLI"
echo "==========================================="

# Step 1: Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install puppeteer puppeteer-core

# Step 2: Install Chromium for Termux
echo ""
echo "📦 Installing Chromium for Termux..."
pkg update && pkg install chromium -y

# Step 3: Get Chromium path
CHROMIUM_PATH=$(which chromium)
echo "✅ Chromium installed at: $CHROMIUM_PATH"

# Step 4: Create Puppeteer configuration
echo ""
echo "⚙️ Creating Puppeteer configuration..."
cat > puppeteer-config.js << EOF
const puppeteer = require('puppeteer-core');

const config = {
    // Termux-specific Chromium configuration
    executablePath: '${CHROMIUM_PATH}',
    
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
EOF

# Step 5: Create test script
echo ""
echo "🧪 Creating test script..."
cat > test-puppeteer.js << 'EOF'
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
EOF

# Step 6: Create EAS log fetcher with Puppeteer
echo ""
echo "📝 Creating EAS log fetcher..."
cat > fetch-eas-logs-puppeteer.js << 'EOF'
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
EOF

# Step 7: Create Claude Code CLI integration
echo ""
echo "🔗 Creating Claude Code CLI integration..."
cat > claude-puppeteer.js << 'EOF'
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
EOF

chmod +x claude-puppeteer.js

# Step 8: Create convenience scripts
echo ""
echo "📝 Creating convenience scripts..."

# EAS log fetcher wrapper
cat > fetch-eas-logs.sh << 'EOF'
#!/bin/bash
BUILD_ID="${1:-$(eas build:list --limit 1 --non-interactive --json 2>/dev/null | jq -r '.[0].id')}"

if [ -z "$BUILD_ID" ] || [ "$BUILD_ID" = "null" ]; then
    echo "❌ No build ID provided and couldn't fetch latest build"
    echo "Usage: $0 [build-id]"
    exit 1
fi

echo "📥 Fetching logs for build: $BUILD_ID"
node fetch-eas-logs-puppeteer.js "$BUILD_ID"
EOF
chmod +x fetch-eas-logs.sh

# Step 9: Add to PATH
echo ""
echo "📂 Setting up PATH..."
mkdir -p ~/bin
ln -sf "$PWD/fetch-eas-logs.sh" ~/bin/
ln -sf "$PWD/claude-puppeteer.js" ~/bin/claude-web

echo ""
echo "✅ Puppeteer setup complete!"
echo ""
echo "📋 Usage Examples:"
echo "1. Test Puppeteer: node test-puppeteer.js"
echo "2. Fetch EAS logs: ./fetch-eas-logs.sh [build-id]"
echo "3. Claude with web: claude-web 'analyze this' https://example.com"
echo ""
echo "🔧 Troubleshooting:"
echo "- If Chromium fails, try: pkg reinstall chromium"
echo "- For permission errors: chmod +x *.sh *.js"
echo "- Check Chromium: chromium --version"