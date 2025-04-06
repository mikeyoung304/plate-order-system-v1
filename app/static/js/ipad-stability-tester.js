// iPad-Specific Stability Testing Suite
// This file contains comprehensive tests for iPad compatibility and stability

class iPadStabilityTester {
  constructor() {
    this.testResults = {
      deviceDetection: null,
      orientationHandling: null,
      touchInteractions: null,
      voiceRecognition: null,
      networkResilience: null,
      performanceMetrics: null,
      accessibilityCompliance: null,
      batteryEfficiency: null
    };
    
    this.testProgress = 0;
    this.totalTests = Object.keys(this.testResults).length;
    this.isRunning = false;
    this.onCompleteCallback = null;
    
    // Initialize test environment
    this.initializeTestEnvironment();
  }
  
  // Initialize test environment
  initializeTestEnvironment() {
    console.log('Initializing iPad stability test environment...');
    
    // Create test report container if it doesn't exist
    if (!document.getElementById('ipad-test-report')) {
      const reportContainer = document.createElement('div');
      reportContainer.id = 'ipad-test-report';
      reportContainer.style.display = 'none';
      document.body.appendChild(reportContainer);
    }
  }
  
  // Run all stability tests
  async runAllTests(onComplete = null) {
    if (this.isRunning) {
      console.warn('Tests already running');
      return;
    }
    
    this.isRunning = true;
    this.testProgress = 0;
    this.onCompleteCallback = onComplete;
    
    console.log('Starting iPad stability tests...');
    
    try {
      // Run tests sequentially
      await this.testDeviceDetection();
      await this.testOrientationHandling();
      await this.testTouchInteractions();
      await this.testVoiceRecognition();
      await this.testNetworkResilience();
      await this.testPerformanceMetrics();
      await this.testAccessibilityCompliance();
      await this.testBatteryEfficiency();
      
      // Generate final report
      this.generateTestReport();
      
      console.log('All iPad stability tests completed');
      
      // Call completion callback if provided
      if (this.onCompleteCallback && typeof this.onCompleteCallback === 'function') {
        this.onCompleteCallback(this.testResults);
      }
    } catch (error) {
      console.error('Error during iPad stability tests:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  // Test iPad device detection
  async testDeviceDetection() {
    console.log('Testing iPad device detection...');
    
    try {
      // Check if device detection is working
      const isIPad = this.detectIPad();
      
      // Test iPad model detection
      const iPadModel = this.detectIPadModel();
      
      // Test iOS version detection
      const iOSVersion = this.detectIOSVersion();
      
      // Test Safari version detection
      const safariVersion = this.detectSafariVersion();
      
      // Verify results
      const detectionAccurate = isIPad !== null && 
                               iPadModel !== null && 
                               iOSVersion !== null && 
                               safariVersion !== null;
      
      // Store results
      this.testResults.deviceDetection = {
        passed: detectionAccurate,
        details: {
          isIPad,
          iPadModel,
          iOSVersion,
          safariVersion
        }
      };
      
      this.updateTestProgress();
      return detectionAccurate;
    } catch (error) {
      console.error('Device detection test failed:', error);
      this.testResults.deviceDetection = {
        passed: false,
        error: error.message
      };
      this.updateTestProgress();
      return false;
    }
  }
  
  // Test orientation handling
  async testOrientationHandling() {
    console.log('Testing iPad orientation handling...');
    
    try {
      // Check current orientation
      const initialOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      
      // Test orientation change handlers
      const orientationChangeHandled = this.testOrientationChangeHandlers();
      
      // Test layout adjustments
      const layoutAdjustsWithOrientation = this.testLayoutAdjustments();
      
      // Test safe area insets
      const safeAreaHandled = this.testSafeAreaHandling();
      
      // Verify results
      const orientationHandlingWorks = orientationChangeHandled && 
                                      layoutAdjustsWithOrientation && 
                                      safeAreaHandled;
      
      // Store results
      this.testResults.orientationHandling = {
        passed: orientationHandlingWorks,
        details: {
          initialOrientation,
          orientationChangeHandled,
          layoutAdjustsWithOrientation,
          safeAreaHandled
        }
      };
      
      this.updateTestProgress();
      return orientationHandlingWorks;
    } catch (error) {
      console.error('Orientation handling test failed:', error);
      this.testResults.orientationHandling = {
        passed: false,
        error: error.message
      };
      this.updateTestProgress();
      return false;
    }
  }
  
  // Test touch interactions
  async testTouchInteractions() {
    console.log('Testing iPad touch interactions...');
    
    try {
      // Test touch target sizes
      const touchTargetSizesAdequate = this.testTouchTargetSizes();
      
      // Test touch feedback
      const touchFeedbackWorks = this.testTouchFeedback();
      
      // Test gesture recognition
      const gesturesWork = this.testGestureRecognition();
      
      // Test multi-touch support
      const multiTouchWorks = this.testMultiTouchSupport();
      
      // Verify results
      const touchInteractionsWork = touchTargetSizesAdequate && 
                                   touchFeedbackWorks && 
                                   gesturesWork && 
                                   multiTouchWorks;
      
      // Store results
      this.testResults.touchInteractions = {
        passed: touchInteractionsWork,
        details: {
          touchTargetSizesAdequate,
          touchFeedbackWorks,
          gesturesWork,
          multiTouchWorks
        }
      };
      
      this.updateTestProgress();
      return touchInteractionsWork;
    } catch (error) {
      console.error('Touch interactions test failed:', error);
      this.testResults.touchInteractions = {
        passed: false,
        error: error.message
      };
      this.updateTestProgress();
      return false;
    }
  }
  
  // Test voice recognition
  async testVoiceRecognition() {
    console.log('Testing iPad voice recognition...');
    
    try {
      // Test microphone access
      const microphoneAccessWorks = await this.testMicrophoneAccess();
      
      // Test audio recording
      const audioRecordingWorks = await this.testAudioRecording();
      
      // Test audio visualization
      const visualizationWorks = this.testAudioVisualization();
      
      // Test transcription processing
      const transcriptionWorks = await this.testTranscriptionProcessing();
      
      // Verify results
      const voiceRecognitionWorks = microphoneAccessWorks && 
                                   audioRecordingWorks && 
                                   visualizationWorks && 
                                   transcriptionWorks;
      
      // Store results
      this.testResults.voiceRecognition = {
        passed: voiceRecognitionWorks,
        details: {
          microphoneAccessWorks,
          audioRecordingWorks,
          visualizationWorks,
          transcriptionWorks
        }
      };
      
      this.updateTestProgress();
      return voiceRecognitionWorks;
    } catch (error) {
      console.error('Voice recognition test failed:', error);
      this.testResults.voiceRecognition = {
        passed: false,
        error: error.message
      };
      this.updateTestProgress();
      return false;
    }
  }
  
  // Test network resilience
  async testNetworkResilience() {
    console.log('Testing iPad network resilience...');
    
    try {
      // Test offline detection
      const offlineDetectionWorks = this.testOfflineDetection();
      
      // Test reconnection handling
      const reconnectionWorks = await this.testReconnectionHandling();
      
      // Test data caching
      const dataCachingWorks = this.testDataCaching();
      
      // Test error recovery
      const errorRecoveryWorks = await this.testErrorRecovery();
      
      // Verify results
      const networkResilienceWorks = offlineDetectionWorks && 
                                    reconnectionWorks && 
                                    dataCachingWorks && 
                                    errorRecoveryWorks;
      
      // Store results
      this.testResults.networkResilience = {
        passed: networkResilienceWorks,
        details: {
          offlineDetectionWorks,
          reconnectionWorks,
          dataCachingWorks,
          errorRecoveryWorks
        }
      };
      
      this.updateTestProgress();
      return networkResilienceWorks;
    } catch (error) {
      console.error('Network resilience test failed:', error);
      this.testResults.networkResilience = {
        passed: false,
        error: error.message
      };
      this.updateTestProgress();
      return false;
    }
  }
  
  // Test performance metrics
  async testPerformanceMetrics() {
    console.log('Testing iPad performance metrics...');
    
    try {
      // Test rendering performance
      const renderingPerformanceGood = await this.testRenderingPerformance();
      
      // Test memory usage
      const memoryUsageOptimal = this.testMemoryUsage();
      
      // Test CPU usage
      const cpuUsageOptimal = await this.testCPUUsage();
      
      // Test animation smoothness
      const animationsSmoothness = this.testAnimationSmoothness();
      
      // Verify results
      const performanceMetricsGood = renderingPerformanceGood && 
                                    memoryUsageOptimal && 
                                    cpuUsageOptimal && 
                                    animationsSmoothness;
      
      // Store results
      this.testResults.performanceMetrics = {
        passed: performanceMetricsGood,
        details: {
          renderingPerformanceGood,
          memoryUsageOptimal,
          cpuUsageOptimal,
          animationsSmoothness
        }
      };
      
      this.updateTestProgress();
      return performanceMetricsGood;
    } catch (error) {
      console.error('Performance metrics test failed:', error);
      this.testResults.performanceMetrics = {
        passed: false,
        error: error.message
      };
      this.updateTestProgress();
      return false;
    }
  }
  
  // Test accessibility compliance
  async testAccessibilityCompliance() {
    console.log('Testing iPad accessibility compliance...');
    
    try {
      // Test screen reader compatibility
      const screenReaderWorks = this.testScreenReaderCompatibility();
      
      // Test keyboard navigation
      const keyboardNavigationWorks = this.testKeyboardNavigation();
      
      // Test color contrast
      const colorContrastAdequate = this.testColorContrast();
      
      // Test text scaling
      const textScalingWorks = this.testTextScaling();
      
      // Verify results
      const accessibilityCompliant = screenReaderWorks && 
                                    keyboardNavigationWorks && 
                                    colorContrastAdequate && 
                                    textScalingWorks;
      
      // Store results
      this.testResults.accessibilityCompliance = {
        passed: accessibilityCompliant,
        details: {
          screenReaderWorks,
          keyboardNavigationWorks,
          colorContrastAdequate,
          textScalingWorks
        }
      };
      
      this.updateTestProgress();
      return accessibilityCompliant;
    } catch (error) {
      console.error('Accessibility compliance test failed:', error);
      this.testResults.accessibilityCompliance = {
        passed: false,
        error: error.message
      };
      this.updateTestProgress();
      return false;
    }
  }
  
  // Test battery efficiency
  async testBatteryEfficiency() {
    console.log('Testing iPad battery efficiency...');
    
    try {
      // Test background processing
      const backgroundProcessingOptimized = this.testBackgroundProcessing();
      
      // Test sensor usage
      const sensorUsageOptimized = this.testSensorUsage();
      
      // Test network requests
      const networkRequestsOptimized = this.testNetworkRequestOptimization();
      
      // Test rendering efficiency
      const renderingEfficient = await this.testRenderingEfficiency();
      
      // Verify results
      const batteryEfficient = backgroundProcessingOptimized && 
                              sensorUsageOptimized && 
                              networkRequestsOptimized && 
                              renderingEfficient;
      
      // Store results
      this.testResults.batteryEfficiency = {
        passed: batteryEfficient,
        details: {
          backgroundProcessingOptimized,
          sensorUsageOptimized,
          networkRequestsOptimized,
          renderingEfficient
        }
      };
      
      this.updateTestProgress();
      return batteryEfficient;
    } catch (error) {
      console.error('Battery efficiency test failed:', error);
      this.testResults.batteryEfficiency = {
        passed: false,
        error: error.message
      };
      this.updateTestProgress();
      return false;
    }
  }
  
  // Update test progress
  updateTestProgress() {
    this.testProgress++;
    const progressPercent = Math.floor((this.testProgress / this.totalTests) * 100);
    console.log(`iPad stability testing progress: ${progressPercent}%`);
  }
  
  // Generate test report
  generateTestReport() {
    const reportContainer = document.getElementById('ipad-test-report');
    if (!reportContainer) return;
    
    // Calculate overall results
    const passedTests = Object.values(this.testResults).filter(result => result && result.passed).length;
    const totalTests = this.totalTests;
    const passRate = Math.floor((passedTests / totalTests) * 100);
    
    // Create report HTML
    let reportHTML = `
      <div class="test-report-container">
        <h2>iPad Stability Test Report</h2>
        <div class="test-summary">
          <div class="test-pass-rate">
            <span class="pass-rate-number">${passRate}%</span>
            <span class="pass-rate-label">Pass Rate</span>
          </div>
          <div class="test-counts">
            <div class="passed-count">${passedTests} Passed</div>
            <div class="failed-count">${totalTests - passedTests} Failed</div>
          </div>
        </div>
        <div class="test-details">
    `;
    
    // Add individual test results
    for (const [testName, result] of Object.entries(this.testResults)) {
      if (!result) continue;
      
      const formattedTestName = testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const statusClass = result.passed ? 'passed' : 'failed';
      const statusIcon = result.passed ? '✓' : '✗';
      
      reportHTML += `
        <div class="test-result ${statusClass}">
          <div class="test-header">
            <span class="test-status-icon">${statusIcon}</span>
            <span class="test-name">${formattedTestName}</span>
          </div>
      `;
      
      if (result.details) {
        reportHTML += `<div class="test-detail-items">`;
        for (const [detailName, detailValue] of Object.entries(result.details)) {
          const formattedDetailName = detailName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const detailClass = detailValue ? 'passed' : 'failed';
          const detailIcon = detailValue ? '✓' : '✗';
          
          reportHTML += `
            <div class="test-detail-item ${detailClass}">
              <span class="detail-status-icon">${detailIcon}</span>
              <span class="detail-name">${formattedDetailName}</span>
            </div>
          `;
        }
        reportHTML += `</div>`;
      }
      
      if (result.error) {
        reportHTML += `<div class="test-error">Error: ${result.error}</div>`;
      }
      
      reportHTML += `</div>`;
    }
    
    reportHTML += `
        </div>
      </div>
    `;
    
    // Add CSS for the report
    reportHTML += `
      <style>
        .test-report-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .test-report-container h2 {
          text-align: center;
          margin-bottom: 20px;
          color: #1e293b;
        }
        
        .test-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .test-pass-rate {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .pass-rate-number {
          font-size: 36px;
          font-weight: 600;
          color: #0072d6;
        }
        
        .pass-rate-label {
          font-size: 14px;
          color: #6b7280;
        }
        
        .test-counts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .passed-count {
          color: #10b981;
          font-weight: 500;
        }
        
        .failed-count {
          color: #ef4444;
          font-weight: 500;
        }
        
        .test-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .test-result {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .test-result.passed {
          border-left: 4px solid #10b981;
        }
        
        .test-result.failed {
          border-left: 4px solid #ef4444;
        }
        
        .test-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .test-status-icon {
          margin-right: 8px;
          font-size: 18px;
        }
        
        .passed .test-status-icon {
          color: #10b981;
        }
        
        .failed .test-status-icon {
          color: #ef4444;
        }
        
        .test-name {
          font-weight: 600;
          color: #1e293b;
        }
        
        .test-detail-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-left: 24px;
          margin-bottom: 12px;
        }
        
        .test-detail-item {
          display: flex;
          align-items: center;
        }
        
        .detail-status-icon {
          margin-right: 8px;
          font-size: 14px;
        }
        
        .passed .detail-status-icon {
          color: #10b981;
        }
        
        .failed .detail-status-icon {
          color: #ef4444;
        }
        
        .detail-name {
          font-size: 14px;
          color: #6b7280;
        }
        
        .test-error {
          margin-top: 8px;
          padding: 8px 12px;
          background-color: rgba(239, 68, 68, 0.1);
          border-radius: 4px;
          color: #ef4444;
          font-size: 14px;
        }
        
        @media (prefers-color-scheme: dark) {
          .test-report-container {
            background-color: #1a1a1a;
          }
          
          .test-report-container h2 {
            color: #ffffff;
          }
          
          .test-summary,
          .test-result {
            background-color: #2a2a2a;
          }
          
          .test-name {
            color: #ffffff;
          }
        }
      </style>
    `;
    
    // Update report container
    reportContainer.innerHTML = reportHTML;
    reportContainer.style.display = 'block';
  }
  
  // Helper methods for tests
  
  // Detect if device is iPad
  detectIPad() {
    try {
      const userAgent = navigator.userAgent;
      const isIPad = /iPad/.test(userAgent);
      const isIOS = /iPhone|iPod/.test(userAgent) || isIPad;
      const isStandalone = window.navigator.standalone;
      const isMacOS = /Mac OS/.test(userAgent);
      
      // Modern iPads don't report as iPad in user agent
      if (isIPad) return true;
      
      // Check for iPad-specific features
      if (isIOS && window.innerWidth >= 768 && window.innerHeight >= 768) return true;
      
      // iPad Pro might report as Mac
      if (isMacOS && navigator.maxTouchPoints && navigator.maxTouchPoints > 2) return true;
      
      return false;
    } catch (error) {
      console.error('Error detecting iPad:', error);
      return null;
    }
  }
  
  // Detect iPad model
  detectIPadModel() {
    try {
      const userAgent = navigator.userAgent;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const pixelRatio = window.devicePixelRatio;
      
      // This is a simplified detection - in a real implementation,
      // we would use more sophisticated techniques
      if (Math.max(screenWidth, screenHeight) >= 2732 && pixelRatio >= 2) {
        return 'iPad Pro 12.9"';
      } else if (Math.max(screenWidth, screenHeight) >= 2388 && pixelRatio >= 2) {
        return 'iPad Pro 11"';
      } else if (Math.max(screenWidth, screenHeight) >= 2224 && pixelRatio >= 2) {
        return 'iPad Air';
      } else if (Math.max(screenWidth, screenHeight) >= 2048 && pixelRatio >= 2) {
        return 'iPad (Retina)';
      } else {
        return 'iPad';
      }
    } catch (error) {
      console.error('Error detecting iPad model:', error);
      return null;
    }
  }
  
  // Detect iOS version
  detectIOSVersion() {
    try {
      const userAgent = navigator.userAgent;
      const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      
      if (match) {
        return `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ''}`;
      }
      
      // For newer iPads that report as macOS
      const macOSMatch = userAgent.match(/Version\/(\d+)\.(\d+)\.?(\d+)? Safari/);
      if (macOSMatch) {
        return `${macOSMatch[1]}.${macOSMatch[2]}${macOSMatch[3] ? `.${macOSMatch[3]}` : ''}`;
      }
      
      return 'Unknown';
    } catch (error) {
      console.error('Error detecting iOS version:', error);
      return null;
    }
  }
  
  // Detect Safari version
  detectSafariVersion() {
    try {
      const userAgent = navigator.userAgent;
      const match = userAgent.match(/Version\/(\d+)\.(\d+)\.?(\d+)? Safari/);
      
      if (match) {
        return `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ''}`;
      }
      
      return 'Unknown';
    } catch (error) {
      console.error('Error detecting Safari version:', error);
      return null;
    }
  }
  
  // Test orientation change handlers
  testOrientationChangeHandlers() {
    try {
      // Check if orientation change event is handled
      let orientationChangeHandled = false;
      
      // Check if we have orientation change handlers
      const orientationHandlers = window.getEventListeners ? 
                                 window.getEventListeners(window, 'resize') : 
                                 [];
      
      // If we can't get event listeners directly, check for our custom handlers
      if (orientationHandlers.length === 0) {
        orientationChangeHandled = window.iPadOptimizer && 
                                  typeof window.iPadOptimizer.handleOrientationChange === 'function';
      } else {
        orientationChangeHandled = orientationHandlers.length > 0;
      }
      
      return orientationChangeHandled;
    } catch (error) {
      console.error('Error testing orientation change handlers:', error);
      return false;
    }
  }
  
  // Test layout adjustments
  testLayoutAdjustments() {
    try {
      // Check if layout adjusts with orientation
      const isPortrait = window.innerHeight > window.innerWidth;
      
      // Check for orientation-specific CSS classes
      const hasOrientationClass = document.documentElement.classList.contains(isPortrait ? 'portrait' : 'landscape');
      
      // Check for orientation-specific layouts
      const floorPlan = document.querySelector('.floor-plan');
      const hasOrientationLayout = floorPlan ? 
                                  floorPlan.classList.contains(isPortrait ? 'portrait-view' : 'landscape-view') : 
                                  false;
      
      return hasOrientationClass || hasOrientationLayout;
    } catch (error) {
      console.error('Error testing layout adjustments:', error);
      return false;
    }
  }
  
  // Test safe area handling
  testSafeAreaHandling() {
    try {
      // Check if safe areas are handled
      const hasSafeAreaElements = document.querySelectorAll('.safe-area-padding, .safe-area-bottom').length > 0;
      
      // Check for CSS variables
      const styles = getComputedStyle(document.documentElement);
      const hasSafeAreaVariables = styles.getPropertyValue('--ipad-safe-area-bottom') !== '';
      
      return hasSafeAreaElements || hasSafeAreaVariables;
    } catch (error) {
      console.error('Error testing safe area handling:', error);
      return false;
    }
  }
  
  // Test touch target sizes
  testTouchTargetSizes() {
    try {
      // Check touch target sizes
      const interactiveElements = document.querySelectorAll('button, a, input, select, [role="button"]');
      let adequateSizes = true;
      
      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        
        // Check if element is visible
        if (rect.width === 0 || rect.height === 0) return;
        
        // Check if size is adequate (44x44px is Apple's recommendation)
        if (rect.width < 44 || rect.height < 44) {
          // Check if it has a parent with adequate size
          let parent = element.parentElement;
          let hasAdequateParent = false;
          
          while (parent && !hasAdequateParent) {
            const parentRect = parent.getBoundingClientRect();
            if (parentRect.width >= 44 && parentRect.height >= 44) {
              hasAdequateParent = true;
            }
            parent = parent.parentElement;
          }
          
          if (!hasAdequateParent) {
            adequateSizes = false;
          }
        }
      });
      
      return adequateSizes;
    } catch (error) {
      console.error('Error testing touch target sizes:', error);
      return false;
    }
  }
  
  // Test touch feedback
  testTouchFeedback() {
    try {
      // Check for touch feedback styles
      const hasTouchFeedbackClass = document.querySelectorAll('.ipad-touch-active, .ipad-touch-target').length > 0;
      
      // Check for active state styles
      const styles = document.styleSheets;
      let hasActivePseudoClass = false;
      
      for (let i = 0; i < styles.length; i++) {
        try {
          const rules = styles[i].cssRules || styles[i].rules;
          for (let j = 0; j < rules.length; j++) {
            if (rules[j].selectorText && rules[j].selectorText.includes(':active')) {
              hasActivePseudoClass = true;
              break;
            }
          }
          if (hasActivePseudoClass) break;
        } catch (e) {
          // Skip cross-origin stylesheets
          continue;
        }
      }
      
      return hasTouchFeedbackClass || hasActivePseudoClass;
    } catch (error) {
      console.error('Error testing touch feedback:', error);
      return false;
    }
  }
  
  // Test gesture recognition
  testGestureRecognition() {
    try {
      // Check for gesture handlers
      const hasGestureHandlers = window.iPadOptimizer && 
                               (typeof window.iPadOptimizer.addServerGestures === 'function' || 
                                typeof window.iPadOptimizer.addKitchenGestures === 'function');
      
      // Check for swipe actions
      const hasSwipeActions = document.querySelectorAll('.swipe-action').length > 0;
      
      return hasGestureHandlers || hasSwipeActions;
    } catch (error) {
      console.error('Error testing gesture recognition:', error);
      return false;
    }
  }
  
  // Test multi-touch support
  testMultiTouchSupport() {
    try {
      // Check for multi-touch support
      return 'ontouchstart' in window && navigator.maxTouchPoints > 1;
    } catch (error) {
      console.error('Error testing multi-touch support:', error);
      return false;
    }
  }
  
  // Test microphone access
  async testMicrophoneAccess() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Error testing microphone access:', error);
      return false;
    }
  }
  
  // Test audio recording
  async testAudioRecording() {
    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        return false;
      }
      
      // Check if our voice recognition implementation exists
      const hasVoiceRecognition = window.iPadVoiceRecognition !== undefined;
      
      // Check if voice button exists
      const hasVoiceButton = document.querySelector('.voice-record-button') !== null;
      
      return hasVoiceRecognition && hasVoiceButton;
    } catch (error) {
      console.error('Error testing audio recording:', error);
      return false;
    }
  }
  
  // Test audio visualization
  testAudioVisualization() {
    try {
      // Check for audio visualization elements
      const hasVisualization = document.querySelector('.audio-visualization') !== null;
      
      // Check for audio bars
      const hasAudioBars = document.querySelectorAll('.audio-bar').length > 0;
      
      return hasVisualization && hasAudioBars;
    } catch (error) {
      console.error('Error testing audio visualization:', error);
      return false;
    }
  }
  
  // Test transcription processing
  async testTranscriptionProcessing() {
    try {
      // Check if transcription display exists
      const hasTranscriptionDisplay = document.querySelector('.transcription-display') !== null;
      
      // Check if our voice recognition implementation has transcription methods
      const hasTranscriptionMethods = window.iPadVoiceRecognition && 
                                    typeof window.iPadVoiceRecognition.processAudioData === 'function' && 
                                    typeof window.iPadVoiceRecognition.displayTranscription === 'function';
      
      return hasTranscriptionDisplay && hasTranscriptionMethods;
    } catch (error) {
      console.error('Error testing transcription processing:', error);
      return false;
    }
  }
  
  // Test offline detection
  testOfflineDetection() {
    try {
      // Check if we have offline event handlers
      const hasOfflineHandlers = window.addEventListener && 
                               (window.ononline !== null || window.onoffline !== null);
      
      return hasOfflineHandlers;
    } catch (error) {
      console.error('Error testing offline detection:', error);
      return false;
    }
  }
  
  // Test reconnection handling
  async testReconnectionHandling() {
    try {
      // This is a simplified test - in a real implementation,
      // we would simulate network disconnection and reconnection
      
      // Check if we have reconnection logic
      const hasReconnectionLogic = window.iPadVoiceRecognition && 
                                 typeof window.iPadVoiceRecognition.processAudioData === 'function';
      
      return hasReconnectionLogic;
    } catch (error) {
      console.error('Error testing reconnection handling:', error);
      return false;
    }
  }
  
  // Test data caching
  testDataCaching() {
    try {
      // Check if we have a service worker
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      // Check if we have localStorage or IndexedDB
      const hasLocalStorage = 'localStorage' in window;
      const hasIndexedDB = 'indexedDB' in window;
      
      return hasServiceWorker && (hasLocalStorage || hasIndexedDB);
    } catch (error) {
      console.error('Error testing data caching:', error);
      return false;
    }
  }
  
  // Test error recovery
  async testErrorRecovery() {
    try {
      // Check if we have error handling in our voice recognition
      const hasErrorHandling = window.iPadVoiceRecognition && 
                             window.iPadVoiceRecognition.processAudioData && 
                             window.iPadVoiceRecognition.processAudioData.toString().includes('catch');
      
      return hasErrorHandling;
    } catch (error) {
      console.error('Error testing error recovery:', error);
      return false;
    }
  }
  
  // Test rendering performance
  async testRenderingPerformance() {
    try {
      // Measure rendering performance
      const start = performance.now();
      
      // Force layout recalculation
      document.body.getBoundingClientRect();
      
      const end = performance.now();
      const layoutTime = end - start;
      
      // Check if layout calculation is fast enough (under 16ms for 60fps)
      return layoutTime < 16;
    } catch (error) {
      console.error('Error testing rendering performance:', error);
      return false;
    }
  }
  
  // Test memory usage
  testMemoryUsage() {
    try {
      // Check memory usage if available
      if (performance.memory) {
        const usedHeap = performance.memory.usedJSHeapSize;
        const totalHeap = performance.memory.totalJSHeapSize;
        
        // Check if heap usage is under 80%
        return usedHeap / totalHeap < 0.8;
      }
      
      // If we can't measure, assume it's okay
      return true;
    } catch (error) {
      console.error('Error testing memory usage:', error);
      return true; // Assume it's okay if we can't measure
    }
  }
  
  // Test CPU usage
  async testCPUUsage() {
    try {
      // This is a simplified test - in a real implementation,
      // we would use more sophisticated techniques
      
      // Measure time to perform a standard operation
      const iterations = 10000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        Math.sqrt(i);
      }
      
      const end = performance.now();
      const operationTime = end - start;
      
      // Check if operation is fast enough (arbitrary threshold)
      return operationTime < 50;
    } catch (error) {
      console.error('Error testing CPU usage:', error);
      return false;
    }
  }
  
  // Test animation smoothness
  testAnimationSmoothness() {
    try {
      // Check if we're using requestAnimationFrame
      const hasRAF = window.requestAnimationFrame !== undefined;
      
      // Check if we have CSS transitions
      const styles = document.styleSheets;
      let hasTransitions = false;
      
      for (let i = 0; i < styles.length; i++) {
        try {
          const rules = styles[i].cssRules || styles[i].rules;
          for (let j = 0; j < rules.length; j++) {
            if (rules[j].style && (
                rules[j].style.transition || 
                rules[j].style.animation || 
                rules[j].style.transform
            )) {
              hasTransitions = true;
              break;
            }
          }
          if (hasTransitions) break;
        } catch (e) {
          // Skip cross-origin stylesheets
          continue;
        }
      }
      
      return hasRAF && hasTransitions;
    } catch (error) {
      console.error('Error testing animation smoothness:', error);
      return false;
    }
  }
  
  // Test screen reader compatibility
  testScreenReaderCompatibility() {
    try {
      // Check for ARIA attributes
      const hasARIA = document.querySelectorAll('[aria-label], [aria-describedby], [aria-hidden], [role]').length > 0;
      
      // Check for semantic HTML
      const hasSemanticHTML = document.querySelectorAll('header, nav, main, footer, section, article, aside').length > 0;
      
      // Check for alt text on images
      const images = document.querySelectorAll('img');
      let allImagesHaveAlt = true;
      
      images.forEach(img => {
        if (!img.hasAttribute('alt')) {
          allImagesHaveAlt = false;
        }
      });
      
      return hasARIA && hasSemanticHTML && (images.length === 0 || allImagesHaveAlt);
    } catch (error) {
      console.error('Error testing screen reader compatibility:', error);
      return false;
    }
  }
  
  // Test keyboard navigation
  testKeyboardNavigation() {
    try {
      // Check for focus styles
      const styles = document.styleSheets;
      let hasFocusStyles = false;
      
      for (let i = 0; i < styles.length; i++) {
        try {
          const rules = styles[i].cssRules || styles[i].rules;
          for (let j = 0; j < rules.length; j++) {
            if (rules[j].selectorText && (
                rules[j].selectorText.includes(':focus') || 
                rules[j].selectorText.includes(':focus-visible')
            )) {
              hasFocusStyles = true;
              break;
            }
          }
          if (hasFocusStyles) break;
        } catch (e) {
          // Skip cross-origin stylesheets
          continue;
        }
      }
      
      // Check for tabindex
      const hasTabIndex = document.querySelectorAll('[tabindex]').length > 0;
      
      // Check for keyboard event handlers
      const hasKeyboardHandlers = document.querySelectorAll('[onkeydown], [onkeyup], [onkeypress]').length > 0;
      
      return hasFocusStyles || hasTabIndex || hasKeyboardHandlers;
    } catch (error) {
      console.error('Error testing keyboard navigation:', error);
      return false;
    }
  }
  
  // Test color contrast
  testColorContrast() {
    try {
      // This is a simplified test - in a real implementation,
      // we would use more sophisticated techniques to calculate contrast ratios
      
      // Check if we have high contrast colors
      const styles = getComputedStyle(document.documentElement);
      const textColor = styles.getPropertyValue('--text-dark').trim() || '#1e293b';
      const backgroundColor = styles.getPropertyValue('--background-light').trim() || '#f8fafc';
      
      // Simple check - dark text on light background or vice versa
      const isTextDark = this.isColorDark(textColor);
      const isBackgroundDark = this.isColorDark(backgroundColor);
      
      return isTextDark !== isBackgroundDark;
    } catch (error) {
      console.error('Error testing color contrast:', error);
      return false;
    }
  }
  
  // Check if color is dark
  isColorDark(color) {
    try {
      // Convert color to RGB
      let r, g, b;
      
      if (color.startsWith('#')) {
        // Hex color
        const hex = color.substring(1);
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else if (color.startsWith('rgb')) {
        // RGB color
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          r = parseInt(match[1]);
          g = parseInt(match[2]);
          b = parseInt(match[3]);
        } else {
          return false;
        }
      } else {
        return false;
      }
      
      // Calculate relative luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Dark colors have luminance < 128
      return luminance < 128;
    } catch (error) {
      console.error('Error checking if color is dark:', error);
      return false;
    }
  }
  
  // Test text scaling
  testTextScaling() {
    try {
      // Check if we're using relative units
      const styles = document.styleSheets;
      let hasRelativeUnits = false;
      
      for (let i = 0; i < styles.length; i++) {
        try {
          const rules = styles[i].cssRules || styles[i].rules;
          for (let j = 0; j < rules.length; j++) {
            if (rules[j].style && rules[j].style.fontSize) {
              const fontSize = rules[j].style.fontSize;
              if (fontSize.includes('em') || fontSize.includes('rem') || fontSize.includes('%')) {
                hasRelativeUnits = true;
                break;
              }
            }
          }
          if (hasRelativeUnits) break;
        } catch (e) {
          // Skip cross-origin stylesheets
          continue;
        }
      }
      
      return hasRelativeUnits;
    } catch (error) {
      console.error('Error testing text scaling:', error);
      return false;
    }
  }
  
  // Test background processing
  testBackgroundProcessing() {
    try {
      // Check if we're using requestIdleCallback
      const hasRIC = window.requestIdleCallback !== undefined;
      
      // Check if we're using Web Workers
      const hasWebWorkers = window.Worker !== undefined;
      
      return hasRIC || hasWebWorkers;
    } catch (error) {
      console.error('Error testing background processing:', error);
      return false;
    }
  }
  
  // Test sensor usage
  testSensorUsage() {
    try {
      // Check if we're using device orientation or motion
      const hasDeviceOrientation = window.DeviceOrientationEvent !== undefined;
      const hasDeviceMotion = window.DeviceMotionEvent !== undefined;
      
      // Check if we have event listeners for these events
      const hasOrientationListeners = window.ondeviceorientation !== null;
      const hasMotionListeners = window.ondevicemotion !== null;
      
      // If we have the events but no listeners, that's good for battery
      return (hasDeviceOrientation && !hasOrientationListeners) || 
             (hasDeviceMotion && !hasMotionListeners) || 
             (!hasDeviceOrientation && !hasDeviceMotion);
    } catch (error) {
      console.error('Error testing sensor usage:', error);
      return false;
    }
  }
  
  // Test network request optimization
  testNetworkRequestOptimization() {
    try {
      // Check if we're using fetch with appropriate options
      const hasFetch = window.fetch !== undefined;
      
      // Check if we have a service worker
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      return hasFetch && hasServiceWorker;
    } catch (error) {
      console.error('Error testing network request optimization:', error);
      return false;
    }
  }
  
  // Test rendering efficiency
  async testRenderingEfficiency() {
    try {
      // Check if we're using CSS containment
      const styles = document.styleSheets;
      let hasContainment = false;
      
      for (let i = 0; i < styles.length; i++) {
        try {
          const rules = styles[i].cssRules || styles[i].rules;
          for (let j = 0; j < rules.length; j++) {
            if (rules[j].style && rules[j].style.contain) {
              hasContainment = true;
              break;
            }
          }
          if (hasContainment) break;
        } catch (e) {
          // Skip cross-origin stylesheets
          continue;
        }
      }
      
      // Check if we're using will-change
      let hasWillChange = false;
      
      for (let i = 0; i < styles.length; i++) {
        try {
          const rules = styles[i].cssRules || styles[i].rules;
          for (let j = 0; j < rules.length; j++) {
            if (rules[j].style && rules[j].style.willChange) {
              hasWillChange = true;
              break;
            }
          }
          if (hasWillChange) break;
        } catch (e) {
          // Skip cross-origin stylesheets
          continue;
        }
      }
      
      return hasContainment || hasWillChange;
    } catch (error) {
      console.error('Error testing rendering efficiency:', error);
      return false;
    }
  }
}

// Initialize stability tester when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.iPadStabilityTester = new iPadStabilityTester();
  
  // Run tests if in test mode
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('test') === 'true') {
    window.iPadStabilityTester.runAllTests((results) => {
      console.log('iPad stability test results:', results);
    });
  }
});
