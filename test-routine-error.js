const puppeteer = require('puppeteer');

async function testRoutineExpansion() {
  console.log('Starting routine expansion test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1200, height: 800 }
  });

  try {
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
    });
    
    // Listen for errors
    page.on('error', err => {
      console.error('[PAGE ERROR]:', err);
    });
    
    page.on('pageerror', err => {
      console.error('[PAGE ERROR]:', err.message);
    });

    // Navigate to the app
    console.log('Navigating to app...');
    await page.goto('http://localhost:8084', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for the app to load
    await page.waitForTimeout(3000);
    
    // Navigate to Routines tab
    console.log('Looking for Routines tab...');
    const routinesTab = await page.waitForSelector('text/Routines', { timeout: 10000 });
    await routinesTab.click();
    
    await page.waitForTimeout(2000);
    
    // Look for any routine card
    console.log('Looking for routine cards...');
    const routineCards = await page.$$('[class*="routineCard"]');
    
    if (routineCards.length === 0) {
      console.log('No routines found. Creating one first...');
      
      // Click create button
      const createButton = await page.waitForSelector('[class*="fab"]', { timeout: 5000 });
      await createButton.click();
      
      // Fill routine form
      await page.waitForSelector('input[placeholder*="Morning Routine"]', { timeout: 5000 });
      await page.type('input[placeholder*="Morning Routine"]', 'Test Routine');
      
      // Click Next
      const nextButton = await page.waitForSelector('text/Next', { timeout: 5000 });
      await nextButton.click();
      
      // Add a task
      const addTaskButton = await page.waitForSelector('text/Add Task', { timeout: 5000 });
      await addTaskButton.click();
      
      await page.waitForSelector('input[placeholder*="Brush teeth"]', { timeout: 5000 });
      await page.type('input[placeholder*="Brush teeth"]', 'Test Task');
      
      const addButton = await page.waitForSelector('text/Add', { timeout: 5000 });
      await addButton.click();
      
      // Click Next again
      await page.waitForTimeout(1000);
      const nextButton2 = await page.waitForSelector('text/Next', { timeout: 5000 });
      await nextButton2.click();
      
      // Create routine
      await page.waitForTimeout(1000);
      const createRoutineButton = await page.waitForSelector('text/Create Routine', { timeout: 5000 });
      await createRoutineButton.click();
      
      await page.waitForTimeout(3000);
    }
    
    // Now try to expand a routine
    console.log('Attempting to expand routine...');
    const routineCard = await page.waitForSelector('[class*="routineCard"]', { timeout: 5000 });
    await routineCard.click();
    
    // Wait to see if modal opens or error occurs
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'routine-expansion-result.png' });
    console.log('Screenshot saved as routine-expansion-result.png');
    
  } catch (error) {
    console.error('Test error:', error);
    await browser.close();
    throw error;
  }
  
  console.log('Test complete. Check console output for errors.');
  await browser.close();
}

testRoutineExpansion().catch(console.error);