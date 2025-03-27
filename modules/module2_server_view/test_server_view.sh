#!/bin/bash

# Task: Test Server View
# This script tests the server view implementation

echo "Starting task: Test Server View"
echo "============================="

# Set up variables
PROJECT_ROOT="$(pwd)"
SERVER_VIEW_TEMPLATE="$PROJECT_ROOT/app/templates/server-view.html"
SERVER_VIEW_CSS="$PROJECT_ROOT/app/static/css/server-view.css"
SERVER_VIEW_JS="$PROJECT_ROOT/app/static/js/server-view.js"

# Check if all required files exist
echo "Checking if all required files exist..."
MISSING_FILES=0

if [ ! -f "$SERVER_VIEW_TEMPLATE" ]; then
    echo "Error: server-view.html not found. Please run create_server_view_template.sh first."
    MISSING_FILES=1
fi

if [ ! -f "$SERVER_VIEW_CSS" ]; then
    echo "Error: server-view.css not found. Please run create_server_view_css.sh first."
    MISSING_FILES=1
fi

if [ ! -f "$SERVER_VIEW_JS" ]; then
    echo "Error: server-view.js not found. Please run implement_server_view_js.sh first."
    MISSING_FILES=1
fi

if [ $MISSING_FILES -eq 1 ]; then
    echo "Some required files are missing. Please run the previous tasks first."
    exit 1
fi

echo "All required files exist."

# Check if the server is running
echo "Checking if the server is running..."
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "Server is not running. Starting the server..."
    # Start the server in the background
    python run.py &
    SERVER_PID=$!
    
    # Wait for the server to start
    echo "Waiting for the server to start..."
    sleep 5
    
    # Check if the server started successfully
    if ! curl -s http://localhost:8000 > /dev/null; then
        echo "Error: Failed to start the server."
        exit 1
    fi
    
    echo "Server started successfully."
else
    echo "Server is already running."
    SERVER_PID=""
fi

# Create a test script for browser testing
echo "Creating test script for browser testing..."
TEST_SCRIPT="$PROJECT_ROOT/test_server_view.js"

cat > "$TEST_SCRIPT" << 'EOF'
const puppeteer = require('puppeteer');

async function testServerView() {
  console.log('Starting browser test for Server View...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1024,
      height: 768
    }
  });
  
  try {
    // Open a new page
    const page = await browser.newPage();
    
    // Navigate to the server view
    console.log('Navigating to server view...');
    await page.goto('http://localhost:8000/server-view', {
      waitUntil: 'networkidle2'
    });
    
    // Wait for the page to load
    await page.waitForSelector('#floor-plan');
    console.log('Server view loaded successfully.');
    
    // Take a screenshot
    await page.screenshot({ path: 'server-view-screenshot.png' });
    console.log('Screenshot saved to server-view-screenshot.png');
    
    // Test floor plan interaction
    console.log('Testing floor plan interaction...');
    const tables = await page.$$('.table');
    
    if (tables.length > 0) {
      // Click on the first table
      await tables[0].click();
      
      // Wait for the table to be selected
      await page.waitForFunction(() => {
        const selectedTable = document.querySelector('.table.selected');
        return selectedTable !== null;
      });
      
      console.log('Table selection works.');
      
      // Test voice order button
      const voiceOrderBtn = await page.$('#voice-order-btn');
      if (voiceOrderBtn) {
        await voiceOrderBtn.click();
        
        // Wait for the modal to appear
        await page.waitForSelector('#voice-recorder-modal:not(.hidden)');
        console.log('Voice recorder modal opens correctly.');
        
        // Close the modal
        const closeModalBtn = await page.$('#close-voice-modal');
        if (closeModalBtn) {
          await closeModalBtn.click();
          
          // Wait for the modal to disappear
          await page.waitForFunction(() => {
            const modal = document.querySelector('#voice-recorder-modal');
            return modal.classList.contains('hidden');
          });
          
          console.log('Voice recorder modal closes correctly.');
        }
      }
      
      // Test zoom controls
      const zoomInBtn = await page.$('#zoom-in-btn');
      const zoomOutBtn = await page.$('#zoom-out-btn');
      
      if (zoomInBtn && zoomOutBtn) {
        await zoomInBtn.click();
        await page.waitForTimeout(500);
        await zoomOutBtn.click();
        console.log('Zoom controls work.');
      }
    } else {
      console.log('No tables found in the floor plan.');
    }
    
    // Test responsive design
    console.log('Testing responsive design...');
    
    // Resize to tablet size
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'server-view-tablet.png' });
    console.log('Tablet view screenshot saved to server-view-tablet.png');
    
    // Resize to mobile size
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'server-view-mobile.png' });
    console.log('Mobile view screenshot saved to server-view-mobile.png');
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

testServerView();
EOF

echo "Test script created."

# Check if puppeteer is installed
echo "Checking if puppeteer is installed..."
if ! npm list puppeteer > /dev/null 2>&1; then
    echo "Puppeteer is not installed. Installing puppeteer..."
    npm install puppeteer
    echo "Puppeteer installed."
else
    echo "Puppeteer is already installed."
fi

# Run the test script
echo "Running the test script..."
echo "Note: This will open a browser window to test the server view."
echo "Please do not interact with the browser during the test."
echo "Press Enter to continue or Ctrl+C to cancel."
read

node "$TEST_SCRIPT"

# Clean up
echo "Cleaning up..."
rm "$TEST_SCRIPT"

# Stop the server if we started it
if [ -n "$SERVER_PID" ]; then
    echo "Stopping the server..."
    kill $SERVER_PID
    echo "Server stopped."
fi

echo "Test results:"
echo "- Screenshots have been saved to the project root directory."
echo "- Check the console output for any errors."

echo "Task completed: Test Server View"
exit 0