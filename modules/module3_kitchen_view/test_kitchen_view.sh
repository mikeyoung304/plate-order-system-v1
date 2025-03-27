#!/bin/bash

# Task: Test Kitchen View
# This script tests the kitchen view implementation

echo "Starting task: Test Kitchen View"
echo "========================================"

# Set up variables
PROJECT_ROOT="$(pwd)"
APP_DIR="$PROJECT_ROOT/app"
TEMPLATES_DIR="$APP_DIR/templates"
CSS_DIR="$APP_DIR/static/css"
JS_DIR="$APP_DIR/static/js"
COMPONENTS_DIR="$APP_DIR/static/js/components/orders"

# Check if all required files exist
echo "Checking if all required files exist..."

# Array of files to check
FILES_TO_CHECK=(
    "$TEMPLATES_DIR/kitchen-view.html"
    "$CSS_DIR/kitchen-view.css"
    "$JS_DIR/kitchen-view.js"
    "$COMPONENTS_DIR/OrderCard.js"
    "$COMPONENTS_DIR/OrderFilters.js"
    "$APP_DIR/api/websocket.py"
)

# Check each file
ALL_FILES_EXIST=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ File not found: $file"
        ALL_FILES_EXIST=false
    else
        echo "✅ File exists: $file"
    fi
done

if [ "$ALL_FILES_EXIST" = false ]; then
    echo "Error: Some required files are missing. Please check the implementation."
    exit 1
fi

echo "All required files exist."

# Check if the server is running
echo "Checking if the server is running..."
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "Starting the server..."
    # Start the server in the background
    python "$PROJECT_ROOT/run.py" &
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
fi

# Test the kitchen view route
echo "Testing the kitchen view route..."
if curl -s http://localhost:8000/kitchen-view > /dev/null; then
    echo "✅ Kitchen view route is accessible."
else
    echo "❌ Kitchen view route is not accessible."
    exit 1
fi

# Test WebSocket endpoint
echo "Testing WebSocket endpoint..."
if curl -s http://localhost:8000/ws/kitchen > /dev/null; then
    echo "✅ WebSocket endpoint is accessible."
else
    echo "❌ WebSocket endpoint is not accessible."
    # This is not a critical error as WebSockets can't be tested with curl
    echo "Note: WebSocket endpoints may not respond to HTTP requests, this is expected."
fi

# Create a test script for Puppeteer
echo "Creating Puppeteer test script..."
TEST_SCRIPT="$PROJECT_ROOT/test_kitchen_view.js"

cat > "$TEST_SCRIPT" << 'EOF'
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'test_screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

(async () => {
    console.log('Starting browser for kitchen view tests...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--window-size=1024,768']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set viewport to iPad size
        await page.setViewport({ width: 1024, height: 768 });
        
        console.log('Navigating to kitchen view...');
        await page.goto('http://localhost:8000/kitchen-view', {
            waitUntil: 'networkidle2',
            timeout: 10000
        });
        
        // Take a screenshot of the initial view
        console.log('Taking screenshot of initial view...');
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'kitchen_view_initial.png'),
            fullPage: true 
        });
        
        // Wait for orders to load
        console.log('Waiting for orders to load...');
        await page.waitForSelector('.order-card, .orders-empty:not(.hidden)', {
            timeout: 5000
        }).catch(() => {
            console.log('No orders or empty state found within timeout.');
        });
        
        // Take a screenshot after orders load
        console.log('Taking screenshot after orders load...');
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'kitchen_view_orders_loaded.png'),
            fullPage: true 
        });
        
        // Test view toggle
        console.log('Testing view toggle...');
        await page.click('#list-view-btn');
        await page.waitForTimeout(500);
        
        // Take a screenshot of list view
        console.log('Taking screenshot of list view...');
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'kitchen_view_list_view.png'),
            fullPage: true 
        });
        
        // Switch back to grid view
        await page.click('#grid-view-btn');
        await page.waitForTimeout(500);
        
        // Test filter dropdown
        console.log('Testing filter dropdown...');
        await page.select('#order-filter', 'all');
        await page.waitForTimeout(1000);
        
        // Take a screenshot with all orders filter
        console.log('Taking screenshot with all orders filter...');
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'kitchen_view_all_orders.png'),
            fullPage: true 
        });
        
        // Test refresh button
        console.log('Testing refresh button...');
        await page.click('#refresh-btn');
        await page.waitForTimeout(1000);
        
        // Check if any order cards exist
        const hasOrders = await page.evaluate(() => {
            return document.querySelectorAll('.order-card').length > 0;
        });
        
        if (hasOrders) {
            // Test order card interaction
            console.log('Testing order card interaction...');
            
            // Find the first order card with a start button
            const hasStartButton = await page.evaluate(() => {
                const startButtons = Array.from(document.querySelectorAll('.start-btn'));
                return startButtons.length > 0;
            });
            
            if (hasStartButton) {
                // Click the start button on the first order card
                await page.click('.start-btn');
                await page.waitForTimeout(1000);
                
                // Take a screenshot after clicking start
                console.log('Taking screenshot after clicking start button...');
                await page.screenshot({ 
                    path: path.join(screenshotsDir, 'kitchen_view_after_start.png'),
                    fullPage: true 
                });
            } else {
                console.log('No order cards with start buttons found.');
            }
            
            // Test flag button
            const hasFlagButton = await page.evaluate(() => {
                const flagButtons = Array.from(document.querySelectorAll('.flag-btn'));
                return flagButtons.length > 0;
            });
            
            if (hasFlagButton) {
                // Click the flag button on the first order card
                console.log('Testing flag functionality...');
                await page.click('.flag-btn');
                await page.waitForTimeout(500);
                
                // Take a screenshot of flag modal
                console.log('Taking screenshot of flag modal...');
                await page.screenshot({ 
                    path: path.join(screenshotsDir, 'kitchen_view_flag_modal.png')
                });
                
                // Close the flag modal
                await page.click('#cancel-flag');
                await page.waitForTimeout(500);
            } else {
                console.log('No order cards with flag buttons found.');
            }
        } else {
            console.log('No order cards found to test interactions.');
        }
        
        // Test responsive design
        console.log('Testing responsive design...');
        
        // Test tablet portrait size
        await page.setViewport({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        
        // Take a screenshot of tablet portrait view
        console.log('Taking screenshot of tablet portrait view...');
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'kitchen_view_tablet_portrait.png'),
            fullPage: true 
        });
        
        // Test mobile size
        await page.setViewport({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        // Take a screenshot of mobile view
        console.log('Taking screenshot of mobile view...');
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'kitchen_view_mobile.png'),
            fullPage: true 
        });
        
        console.log('Kitchen view tests completed successfully!');
    } catch (error) {
        console.error('Error during kitchen view tests:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
EOF

echo "Puppeteer test script created."

# Check if Puppeteer is installed
echo "Checking if Puppeteer is installed..."
if ! npm list -g puppeteer > /dev/null 2>&1; then
    echo "Installing Puppeteer..."
    npm install -g puppeteer
    echo "Puppeteer installed."
else
    echo "Puppeteer is already installed."
fi

# Run the Puppeteer test
echo "Running Puppeteer tests..."
node "$TEST_SCRIPT"

# Check if the test was successful
if [ $? -eq 0 ]; then
    echo "✅ Puppeteer tests completed successfully."
else
    echo "❌ Puppeteer tests failed."
    exit 1
fi

# Clean up
echo "Cleaning up..."
rm -f "$TEST_SCRIPT"

echo "Task completed: Test Kitchen View"
exit 0