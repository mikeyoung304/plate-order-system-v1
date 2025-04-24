/**
 * User Experience Optimization Module
 * 
 * This module implements best practices for user experience in the Plate Order System,
 * with specific focus on accessibility, usability, and efficiency for assisted living
 * facility staff and residents.
 */

// Core UX utilities and constants
const UXConstants = {
  // Color palette optimized for accessibility (WCAG AA compliant)
  colors: {
    primary: {
      50: '#f0f7ff',
      100: '#e0effe',
      200: '#bae0fd',
      300: '#7cc5fb',
      400: '#36a9f8',
      500: '#0d8eee',
      600: '#0072d6',
      700: '#005db1',
      800: '#004f92',
      900: '#003b6f',
      950: '#00264d'
    },
    secondary: {
      50: '#fff8f0',
      100: '#ffecd6',
      200: '#ffd4a8',
      300: '#ffb770',
      400: '#ff9838',
      500: '#ff7a00',
      600: '#e16000',
      700: '#bc4600',
      800: '#983800',
      900: '#7c2e00',
      950: '#431400'
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    },
    success: {
      50: '#ecfdf5',
      500: '#10b981',
      700: '#047857'
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      700: '#b45309'
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      700: '#b91c1c'
    },
    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      700: '#1d4ed8'
    }
  },
  
  // Typography scale optimized for readability
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem'     // 48px
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeights: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2
    }
  },
  
  // Spacing scale for consistent layout
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem'      // 96px
  },
  
  // Breakpoints for responsive design
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Animation timings
  animation: {
    durations: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easings: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  
  // Z-index scale
  zIndex: {
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    auto: 'auto'
  }
};

/**
 * Accessibility Enhancement Module
 * Implements WCAG 2.1 AA compliance features
 */
class AccessibilityManager {
  constructor(options = {}) {
    this.highContrastMode = options.highContrastMode || false;
    this.largeTextMode = options.largeTextMode || false;
    this.screenReaderOptimized = options.screenReaderOptimized || false;
    this.reducedMotion = options.reducedMotion || this.detectReducedMotion();
    this.keyboardNavigationEnabled = options.keyboardNavigationEnabled || true;
    
    // Initialize accessibility features
    this.initializeAccessibility();
  }
  
  initializeAccessibility() {
    this.applyAccessibilitySettings();
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupFocusManagement();
  }
  
  detectReducedMotion() {
    // Check if user has requested reduced motion in their system settings
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }
  
  applyAccessibilitySettings() {
    // Apply accessibility settings to the document
    if (typeof document !== 'undefined') {
      const htmlElement = document.documentElement;
      
      // Apply high contrast mode if enabled
      if (this.highContrastMode) {
        htmlElement.classList.add('high-contrast-mode');
      } else {
        htmlElement.classList.remove('high-contrast-mode');
      }
      
      // Apply large text mode if enabled
      if (this.largeTextMode) {
        htmlElement.classList.add('large-text-mode');
      } else {
        htmlElement.classList.remove('large-text-mode');
      }
      
      // Apply screen reader optimizations if enabled
      if (this.screenReaderOptimized) {
        htmlElement.classList.add('sr-optimized');
      } else {
        htmlElement.classList.remove('sr-optimized');
      }
      
      // Apply reduced motion if enabled
      if (this.reducedMotion) {
        htmlElement.classList.add('reduced-motion');
      } else {
        htmlElement.classList.remove('reduced-motion');
      }
    }
  }
  
  setupKeyboardNavigation() {
    // Set up keyboard navigation support
    if (this.keyboardNavigationEnabled && typeof document !== 'undefined') {
      // Add keyboard event listeners
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      
      // Add visible focus styles
      const style = document.createElement('style');
      style.textContent = `
        :focus {
          outline: 2px solid ${UXConstants.colors.primary[600]} !important;
          outline-offset: 2px !important;
        }
        
        .high-contrast-mode :focus {
          outline: 3px solid #ffffff !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 6px #000000 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  handleKeyDown(event) {
    // Handle keyboard navigation
    if (event.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  }
  
  setupScreenReaderSupport() {
    // Set up screen reader support
    if (this.screenReaderOptimized && typeof document !== 'undefined') {
      // Add ARIA landmarks
      this.addAriaLandmarks();
      
      // Add screen reader announcements container
      const announcementsContainer = document.createElement('div');
      announcementsContainer.id = 'sr-announcements';
      announcementsContainer.setAttribute('aria-live', 'polite');
      announcementsContainer.setAttribute('aria-atomic', 'true');
      announcementsContainer.style.position = 'absolute';
      announcementsContainer.style.width = '1px';
      announcementsContainer.style.height = '1px';
      announcementsContainer.style.padding = '0';
      announcementsContainer.style.margin = '-1px';
      announcementsContainer.style.overflow = 'hidden';
      announcementsContainer.style.clip = 'rect(0, 0, 0, 0)';
      announcementsContainer.style.whiteSpace = 'nowrap';
      announcementsContainer.style.border = '0';
      document.body.appendChild(announcementsContainer);
    }
  }
  
  addAriaLandmarks() {
    // Add ARIA landmarks to the document
    if (typeof document !== 'undefined') {
      // Find main content area
      const mainContent = document.querySelector('main') || document.querySelector('.main-content');
      if (mainContent && !mainContent.getAttribute('role')) {
        mainContent.setAttribute('role', 'main');
      }
      
      // Find navigation
      const navigation = document.querySelector('nav') || document.querySelector('.navigation');
      if (navigation && !navigation.getAttribute('role')) {
        navigation.setAttribute('role', 'navigation');
      }
      
      // Find header
      const header = document.querySelector('header') || document.querySelector('.header');
      if (header && !header.getAttribute('role')) {
        header.setAttribute('role', 'banner');
      }
      
      // Find footer
      const footer = document.querySelector('footer') || document.querySelector('.footer');
      if (footer && !footer.getAttribute('role')) {
        footer.setAttribute('role', 'contentinfo');
      }
    }
  }
  
  setupFocusManagement() {
    // Set up focus management for modals, dialogs, etc.
    if (typeof document !== 'undefined') {
      // Track the element that had focus before a modal was opened
      this.previouslyFocusedElement = null;
      
      // Add methods to trap focus within modal dialogs
      this.focusTrap = {
        active: false,
        element: null,
        
        activate: (element) => {
          this.previouslyFocusedElement = document.activeElement;
          this.focusTrap.element = element;
          this.focusTrap.active = true;
          
          // Set focus to the first focusable element in the modal
          const focusableElements = this.getFocusableElements(element);
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
          
          // Add event listener to trap focus
          document.addEventListener('keydown', this.handleTabKey);
        },
        
        deactivate: () => {
          this.focusTrap.active = false;
          document.removeEventListener('keydown', this.handleTabKey);
          
          // Restore focus to the previously focused element
          if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
            this.previouslyFocusedElement = null;
          }
        }
      };
    }
  }
  
  handleTabKey(event) {
    // Handle Tab key to trap focus within modal dialogs
    if (event.key === 'Tab' && this.focusTrap.active) {
      const focusableElements = this.getFocusableElements(this.focusTrap.element);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        // If Shift+Tab and focus is on first element, move to last element
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // If Tab and focus is on last element, move to first element
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
  
  getFocusableElements(element) {
    // Get all focusable elements within a container
    return Array.from(element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
  }
  
  announceToScreenReader(message) {
    // Announce a message to screen readers
    if (typeof document !== 'undefined') {
      const announcementsContainer = document.getElementById('sr-announcements');
      if (announcementsContainer) {
        announcementsContainer.textContent = message;
      }
    }
    
    return {
      success: true,
      message: 'Announced to screen reader',
      announcement: message
    };
  }
  
  toggleHighContrastMode() {
    // Toggle high contrast mode
    this.highContrastMode = !this.highContrastMode;
    this.applyAccessibilitySettings();
    
    return {
      success: true,
      message: `High contrast mode ${this.highContrastMode ? 'enabled' : 'disabled'}`
    };
  }
  
  toggleLargeTextMode() {
    // Toggle large text mode
    this.largeTextMode = !this.largeTextMode;
    this.applyAccessibilitySettings();
    
    return {
      success: true,
      message: `Large text mode ${this.largeTextMode ? 'enabled' : 'disabled'}`
    };
  }
  
  toggleReducedMotion() {
    // Toggle reduced motion mode
    this.reducedMotion = !this.reducedMotion;
    this.applyAccessibilitySettings();
    
    return {
      success: true,
      message: `Reduced motion ${this.reducedMotion ? 'enabled' : 'disabled'}`
    };
  }
}

/**
 * Touch Optimization Module
 * Enhances touch interactions for mobile devices
 */
class TouchOptimizer {
  constructor(options = {}) {
    this.touchEnabled = options.touchEnabled || this.detectTouchSupport();
    this.iosDevice = options.iosDevice || this.detectIOSDevice();
    this.minimumTouchTarget = options.minimumTouchTarget || 44; // WCAG recommendation in pixels
    this.doubleTapTimeout = options.doubleTapTimeout || 300; // milliseconds
    this.longPressTimeout = options.longPressTimeout || 500; // milliseconds
    this.swipeThreshold = options.swipeThreshold || 50; // pixels
    
    // Initialize touch optimizations
    this.initializeTouchOptimizations();
  }
  
  detectTouchSupport() {
    // Detect if touch is supported
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }
  
  detectIOSDevice() {
    // Detect if the device is running iOS
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    return false;
  }
  
  initializeTouchOptimizations() {
    if (this.touchEnabled && typeof document !== 'undefined') {
      // Apply touch-specific CSS
      this.applyTouchStyles();
      
      // Set up iOS-specific optimizations
      if (this.iosDevice) {
        this.applyIOSOptimizations();
      }
      
      // Set up gesture recognition
      this.setupGestureRecognition();
    }
  }
  
  applyTouchStyles() {
    // Apply touch-specific styles to the document
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        /* Increase touch target sizes */
        button, 
        [role="button"],
        input[type="button"],
        input[type="submit"],
        input[type="reset"],
        a {
          min-height: ${this.minimumTouchTarget}px;
          min-width: ${this.minimumTouchTarget}px;
        }
        
        /* Add touch feedback */
        button:active, 
        [role="button"]:active,
        input[type="button"]:active,
        input[type="submit"]:active,
        input[type="reset"]:active,
        a:active {
          transform: scale(0.98);
        }
        
        /* Remove hover effects on touch devices */
        @media (hover: none) {
          button:hover, 
          [role="button"]:hover,
          input[type="button"]:hover,
          input[type="submit"]:hover,
          input[type="reset"]:hover,
          a:hover {
            /* Reset hover styles that might interfere with touch */
          }
        }
        
        /* Add spacing between touch targets */
        button + button,
        [role="button"] + [role="button"],
        input[type="button"] + input[type="button"],
        input[type="submit"] + input[type="submit"],
        input[type="reset"] + input[type="reset"] {
          margin-left: 8px;
        }
      `;
      document.head.appendChild(style);
      
      // Add touch class to body
      document.body.classList.add('touch-device');
      
      // Add iOS class if applicable
      if (this.iosDevice) {
        document.body.classList.add('ios-device');
      }
    }
  }
  
  applyIOSOptimizations() {
    // Apply iOS-specific optimizations
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        /* Fix for iOS 100vh issue */
        .full-height {
          height: 100%;
          height: -webkit-fill-available;
        }
        
        /* Fix for iOS momentum scrolling */
        .scroll-container {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Fix for iOS input zoom */
        input[type="text"],
        input[type="email"],
        input[type="tel"],
        input[type="number"],
        input[type="password"],
        textarea {
          font-size: 16px; /* Prevents zoom on focus */
        }
        
        /* Fix for iOS button styling */
        button,
        [role="button"],
        input[type="button"],
        input[type="submit"],
        input[type="reset"] {
          -webkit-appearance: none;
          border-radius: 0;
        }
      `;
      document.head.appendChild(style);
      
      // Add meta viewport tag if not present
      if (!document.querySelector('meta[name="viewport"]')) {
        const metaViewport = document.createElement('meta');
        metaViewport.name = 'viewport';
        metaViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
        document.head.appendChild(metaViewport);
      }
      
      // Add meta apple-mobile-web-app-capable tag
      if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
        const metaApple = document.createElement('meta');
        metaApple.name = 'apple-mobile-web-app-capable';
        metaApple.content = 'yes';
        document.head.appendChild(metaApple);
      }
    }
  }
  
  setupGestureRecognition() {
    // Set up gesture recognition for touch devices
    if (typeof document !== 'undefined') {
      // Track touch state
      this.touchState = {
        startX: 0,
        startY: 0,
        startTime: 0,
        lastTapTime: 0,
        longPressTimer: null,
        element: null
      };
      
      // Add touch event listeners
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }
  }
  
  handleTouchStart(event) {
    // Handle touch start event
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchState.startX = touch.clientX;
      this.touchState.startY = touch.clientY;
      this.touchState.startTime = Date.now();
      this.touchState.element = event.target;
      
      // Start long press timer
      this.touchState.longPressTimer = setTimeout(() => {
        this.triggerLongPress(event.target, this.touchState.startX, this.touchState.startY);
      }, this.longPressTimeout);
    }
  }
  
  handleTouchMove(event) {
    // Handle touch move event
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.touchState.startX;
      const deltaY = touch.clientY - this.touchState.startY;
      
      // If significant movement, cancel long press
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        clearTimeout(this.touchState.longPressTimer);
      }
    }
  }
  
  handleTouchEnd(event) {
    // Handle touch end event
    clearTimeout(this.touchState.longPressTimer);
    
    const endTime = Date.now();
    const touchDuration = endTime - this.touchState.startTime;
    
    // Check for tap
    if (touchDuration < 300) {
      // Check for double tap
      const timeSinceLastTap = endTime - this.touchState.lastTapTime;
      if (timeSinceLastTap < this.doubleTapTimeout) {
        this.triggerDoubleTap(this.touchState.element, event.changedTouches[0].clientX, event.changedTouches[0].clientY);
        this.touchState.lastTapTime = 0; // Reset to prevent triple tap
      } else {
        this.touchState.lastTapTime = endTime;
      }
    }
    
    // Check for swipe
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - this.touchState.startX;
      const deltaY = touch.clientY - this.touchState.startY;
      
      if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
        this.triggerSwipe(this.touchState.element, deltaX, deltaY);
      }
    }
  }
  
  triggerLongPress(element, x, y) {
    // Trigger long press event
    const longPressEvent = new CustomEvent('longpress', {
      bubbles: true,
      cancelable: true,
      detail: { x, y }
    });
    element.dispatchEvent(longPressEvent);
  }
  
  triggerDoubleTap(element, x, y) {
    // Trigger double tap event
    const doubleTapEvent = new CustomEvent('doubletap', {
      bubbles: true,
      cancelable: true,
      detail: { x, y }
    });
    element.dispatchEvent(doubleTapEvent);
  }
  
  triggerSwipe(element, deltaX, deltaY) {
    // Determine swipe direction
    let direction = '';
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    // Trigger swipe event
    const swipeEvent = new CustomEvent('swipe', {
      bubbles: true,
      cancelable: true,
      detail: { direction, deltaX, deltaY }
    });
    element.dispatchEvent(swipeEvent);
  }
  
  addTouchFeedback(element, options = {}) {
    // Add touch feedback to an element
    if (element) {
      const feedbackType = options.type || 'ripple';
      const color = options.color || UXConstants.colors.primary[500];
      
      if (feedbackType === 'ripple') {
        element.addEventListener('touchstart', (event) => {
          const rect = element.getBoundingClientRect();
          const x = event.touches[0].clientX - rect.left;
          const y = event.touches[0].clientY - rect.top;
          
          this.createRippleEffect(element, x, y, color);
        });
      } else if (feedbackType === 'highlight') {
        element.addEventListener('touchstart', () => {
          element.classList.add('touch-highlight');
        });
        
        element.addEventListener('touchend', () => {
          setTimeout(() => {
            element.classList.remove('touch-highlight');
          }, 150);
        });
      }
    }
  }
  
  createRippleEffect(element, x, y, color) {
    // Create ripple effect
    const ripple = document.createElement('span');
    ripple.classList.add('touch-ripple');
    
    // Calculate ripple size
    const size = Math.max(element.offsetWidth, element.offsetHeight) * 2;
    
    // Position and style ripple
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    ripple.style.backgroundColor = color;
    
    // Add ripple to element
    element.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
}

/**
 * Error Prevention and Recovery Module
 * Implements best practices for preventing and handling errors
 */
class ErrorPreventionManager {
  constructor(options = {}) {
    this.confirmationEnabled = options.confirmationEnabled || true;
    this.autoSaveEnabled = options.autoSaveEnabled || true;
    this.autoSaveInterval = options.autoSaveInterval || 30000; // milliseconds
    this.validationEnabled = options.validationEnabled || true;
    this.undoStackSize = options.undoStackSize || 10;
    
    // Initialize error prevention features
    this.initializeErrorPrevention();
  }
  
  initializeErrorPrevention() {
    // Set up error prevention components
    this.setupConfirmation();
    this.setupAutoSave();
    this.setupValidation();
    this.setupUndoRedo();
  }
  
  setupConfirmation() {
    // Set up confirmation for destructive actions
    this.confirmationHandlers = {
      deleteOrder: (data) => this.confirmAction('Are you sure you want to delete this order?', data),
      cancelOrder: (data) => this.confirmAction('Are you sure you want to cancel this order?', data),
      clearTable: (data) => this.confirmAction('Are you sure you want to clear this table?', data),
      resetSystem: (data) => this.confirmAction('Are you sure you want to reset the system? All unsaved data will be lost.', data)
    };
  }
  
  confirmAction(message, data) {
    // Show confirmation dialog
    return new Promise((resolve, reject) => {
      if (!this.confirmationEnabled) {
        resolve(true);
        return;
      }
      
      // In a real implementation, this would show a modal dialog
      // For this example, we'll simulate a confirmation
      const confirmed = window.confirm(message);
      
      if (confirmed) {
        resolve(data);
      } else {
        reject(new Error('Action cancelled by user'));
      }
    });
  }
  
  setupAutoSave() {
    // Set up auto-save functionality
    if (this.autoSaveEnabled) {
      this.autoSaveData = {};
      this.autoSaveTimestamp = null;
      
      // Start auto-save timer
      this.autoSaveTimer = setInterval(() => {
        this.performAutoSave();
      }, this.autoSaveInterval);
    }
  }
  
  performAutoSave() {
    // Perform auto-save
    const currentData = this.collectCurrentState();
    
    if (JSON.stringify(currentData) !== JSON.stringify(this.autoSaveData)) {
      this.autoSaveData = currentData;
      this.autoSaveTimestamp = new Date();
      
      // Save data to localStorage
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('plateOrderSystemAutoSave', JSON.stringify({
            data: this.autoSaveData,
            timestamp: this.autoSaveTimestamp
          }));
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }
  }
  
  collectCurrentState() {
    // Collect current state for auto-save
    // This would be implemented to gather all relevant application state
    return {};
  }
  
  restoreFromAutoSave() {
    // Restore from auto-save
    if (typeof localStorage !== 'undefined') {
      try {
        const savedData = localStorage.getItem('plateOrderSystemAutoSave');
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          return {
            success: true,
            message: 'Data restored from auto-save',
            data: parsedData.data,
            timestamp: new Date(parsedData.timestamp)
          };
        }
      } catch (error) {
        console.error('Restore from auto-save failed:', error);
      }
    }
    
    return {
      success: false,
      message: 'No auto-save data found'
    };
  }
  
  setupValidation() {
    // Set up form validation
    if (this.validationEnabled && typeof document !== 'undefined') {
      // Add validation styles
      const style = document.createElement('style');
      style.textContent = `
        input:invalid,
        select:invalid,
        textarea:invalid {
          border-color: ${UXConstants.colors.error[500]};
        }
        
        .validation-message {
          color: ${UXConstants.colors.error[500]};
          font-size: ${UXConstants.typography.fontSizes.sm};
          margin-top: ${UXConstants.spacing[1]};
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  validateForm(formElement, customValidators = {}) {
    // Validate a form
    if (!formElement) {
      return {
        success: false,
        message: 'No form element provided',
        errors: []
      };
    }
    
    // Check native validation
    const isNativeValid = formElement.checkValidity();
    
    // Collect all validation errors
    const errors = [];
    
    // Check each form element
    Array.from(formElement.elements).forEach(element => {
      // Skip elements that don't need validation
      if (element.type === 'submit' || element.type === 'button' || element.type === 'reset' || element.type === 'fieldset') {
        return;
      }
      
      // Clear previous validation messages
      const existingMessage = element.parentNode.querySelector('.validation-message');
      if (existingMessage) {
        existingMessage.remove();
      }
      
      // Check native validation
      if (!element.validity.valid) {
        let message = '';
        
        if (element.validity.valueMissing) {
          message = 'This field is required';
        } else if (element.validity.typeMismatch) {
          message = `Please enter a valid ${element.type}`;
        } else if (element.validity.patternMismatch) {
          message = element.dataset.patternMessage || 'Please match the requested format';
        } else if (element.validity.tooShort) {
          message = `Please use at least ${element.minLength} characters`;
        } else if (element.validity.tooLong) {
          message = `Please use no more than ${element.maxLength} characters`;
        } else if (element.validity.rangeUnderflow) {
          message = `Please use a value greater than or equal to ${element.min}`;
        } else if (element.validity.rangeOverflow) {
          message = `Please use a value less than or equal to ${element.max}`;
        } else if (element.validity.stepMismatch) {
          message = `Please use a valid value`;
        } else {
          message = 'This value is invalid';
        }
        
        errors.push({
          element: element,
          message: message
        });
        
        // Add validation message
        const validationMessage = document.createElement('div');
        validationMessage.className = 'validation-message';
        validationMessage.textContent = message;
        element.parentNode.appendChild(validationMessage);
      }
      
      // Check custom validators
      if (customValidators[element.name]) {
        const customResult = customValidators[element.name](element.value, formElement);
        
        if (customResult !== true) {
          errors.push({
            element: element,
            message: customResult
          });
          
          // Add validation message
          const validationMessage = document.createElement('div');
          validationMessage.className = 'validation-message';
          validationMessage.textContent = customResult;
          element.parentNode.appendChild(validationMessage);
        }
      }
    });
    
    // Focus the first invalid element
    if (errors.length > 0) {
      errors[0].element.focus();
    }
    
    return {
      success: errors.length === 0,
      message: errors.length === 0 ? 'Validation successful' : 'Validation failed',
      errors: errors
    };
  }
  
  setupUndoRedo() {
    // Set up undo/redo functionality
    this.undoStack = [];
    this.redoStack = [];
  }
  
  recordAction(action, data) {
    // Record an action for undo/redo
    this.undoStack.push({
      action: action,
      data: data,
      timestamp: new Date()
    });
    
    // Limit stack size
    if (this.undoStack.length > this.undoStackSize) {
      this.undoStack.shift();
    }
    
    // Clear redo stack when a new action is performed
    this.redoStack = [];
    
    return {
      success: true,
      message: 'Action recorded',
      stackSize: this.undoStack.length
    };
  }
  
  undo() {
    // Undo the last action
    if (this.undoStack.length === 0) {
      return {
        success: false,
        message: 'Nothing to undo'
      };
    }
    
    const lastAction = this.undoStack.pop();
    this.redoStack.push(lastAction);
    
    // Perform the undo operation
    // This would be implemented to reverse the action
    
    return {
      success: true,
      message: `Undid ${lastAction.action}`,
      action: lastAction
    };
  }
  
  redo() {
    // Redo the last undone action
    if (this.redoStack.length === 0) {
      return {
        success: false,
        message: 'Nothing to redo'
      };
    }
    
    const nextAction = this.redoStack.pop();
    this.undoStack.push(nextAction);
    
    // Perform the redo operation
    // This would be implemented to reapply the action
    
    return {
      success: true,
      message: `Redid ${nextAction.action}`,
      action: nextAction
    };
  }
}

/**
 * Onboarding and Guidance Module
 * Implements best practices for user onboarding and guidance
 */
class OnboardingManager {
  constructor(options = {}) {
    this.firstTimeUser = options.firstTimeUser || this.checkFirstTimeUser();
    this.onboardingSteps = options.onboardingSteps || this.getDefaultOnboardingSteps();
    this.tooltipsEnabled = options.tooltipsEnabled || true;
    this.contextualHelpEnabled = options.contextualHelpEnabled || true;
    this.currentStep = 0;
    
    // Initialize onboarding features
    this.initializeOnboarding();
  }
  
  checkFirstTimeUser() {
    // Check if this is a first-time user
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('plateOrderSystemOnboarded') !== 'true';
    }
    return true;
  }
  
  getDefaultOnboardingSteps() {
    // Define default onboarding steps
    return [
      {
        title: 'Welcome to Plate Order System',
        content: 'This system helps you take orders using voice commands and manage tables efficiently.',
        target: 'body',
        position: 'center'
      },
      {
        title: 'Floor Plan',
        content: 'This is the floor plan. You can select tables by tapping on them.',
        target: '.floor-plan',
        position: 'right'
      },
      {
        title: 'Voice Ordering',
        content: 'Press and hold this button to record an order using your voice.',
        target: '.voice-button',
        position: 'bottom'
      },
      {
        title: 'Order Details',
        content: 'Order details will appear here. You can review and submit the order.',
        target: '.transcription-result',
        position: 'left'
      },
      {
        title: 'Kitchen View',
        content: 'Switch to the Kitchen View to see all active orders.',
        target: '.nav-link[href*="kitchen"]',
        position: 'bottom'
      }
    ];
  }
  
  initializeOnboarding() {
    // Set up onboarding components
    this.setupTooltips();
    this.setupContextualHelp();
    
    // Start onboarding for first-time users
    if (this.firstTimeUser && typeof document !== 'undefined') {
      // Add onboarding styles
      const style = document.createElement('style');
      style.textContent = `
        .onboarding-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: ${UXConstants.zIndex[40]};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .onboarding-tooltip {
          position: absolute;
          background-color: white;
          border-radius: 8px;
          padding: ${UXConstants.spacing[4]};
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          max-width: 300px;
          z-index: ${UXConstants.zIndex[50]};
        }
        
        .onboarding-tooltip-title {
          font-size: ${UXConstants.typography.fontSizes.lg};
          font-weight: ${UXConstants.typography.fontWeights.bold};
          margin-bottom: ${UXConstants.spacing[2]};
          color: ${UXConstants.colors.neutral[900]};
        }
        
        .onboarding-tooltip-content {
          font-size: ${UXConstants.typography.fontSizes.base};
          margin-bottom: ${UXConstants.spacing[4]};
          color: ${UXConstants.colors.neutral[700]};
        }
        
        .onboarding-tooltip-buttons {
          display: flex;
          justify-content: space-between;
        }
        
        .onboarding-button {
          padding: ${UXConstants.spacing[2]} ${UXConstants.spacing[4]};
          border-radius: 4px;
          font-weight: ${UXConstants.typography.fontWeights.medium};
          cursor: pointer;
        }
        
        .onboarding-button-primary {
          background-color: ${UXConstants.colors.primary[600]};
          color: white;
          border: none;
        }
        
        .onboarding-button-secondary {
          background-color: transparent;
          color: ${UXConstants.colors.neutral[700]};
          border: 1px solid ${UXConstants.colors.neutral[300]};
        }
        
        .onboarding-progress {
          display: flex;
          justify-content: center;
          margin-top: ${UXConstants.spacing[4]};
        }
        
        .onboarding-progress-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: ${UXConstants.colors.neutral[300]};
          margin: 0 4px;
        }
        
        .onboarding-progress-dot.active {
          background-color: ${UXConstants.colors.primary[600]};
        }
      `;
      document.head.appendChild(style);
      
      // Start onboarding after a short delay
      setTimeout(() => {
        this.startOnboarding();
      }, 1000);
    }
  }
  
  setupTooltips() {
    // Set up tooltips for UI elements
    if (this.tooltipsEnabled && typeof document !== 'undefined') {
      // Add tooltip styles
      const style = document.createElement('style');
      style.textContent = `
        [data-tooltip] {
          position: relative;
        }
        
        [data-tooltip]:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: ${UXConstants.colors.neutral[800]};
          color: white;
          padding: ${UXConstants.spacing[2]} ${UXConstants.spacing[3]};
          border-radius: 4px;
          font-size: ${UXConstants.typography.fontSizes.sm};
          white-space: nowrap;
          z-index: ${UXConstants.zIndex[30]};
          margin-bottom: ${UXConstants.spacing[1]};
        }
        
        [data-tooltip]:hover::before {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 5px;
          border-style: solid;
          border-color: ${UXConstants.colors.neutral[800]} transparent transparent transparent;
          z-index: ${UXConstants.zIndex[30]};
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  setupContextualHelp() {
    // Set up contextual help for complex features
    if (this.contextualHelpEnabled && typeof document !== 'undefined') {
      // Add contextual help styles
      const style = document.createElement('style');
      style.textContent = `
        .contextual-help-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: ${UXConstants.colors.neutral[200]};
          color: ${UXConstants.colors.neutral[700]};
          font-size: ${UXConstants.typography.fontSizes.sm};
          font-weight: ${UXConstants.typography.fontWeights.bold};
          cursor: pointer;
          margin-left: ${UXConstants.spacing[1]};
        }
        
        .contextual-help-content {
          display: none;
          position: absolute;
          background-color: white;
          border-radius: 4px;
          padding: ${UXConstants.spacing[3]};
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          max-width: 300px;
          z-index: ${UXConstants.zIndex[20]};
          font-size: ${UXConstants.typography.fontSizes.sm};
          color: ${UXConstants.colors.neutral[700]};
        }
        
        .contextual-help-icon:hover + .contextual-help-content,
        .contextual-help-content:hover {
          display: block;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  startOnboarding() {
    // Start the onboarding process
    this.currentStep = 0;
    this.showOnboardingStep();
  }
  
  showOnboardingStep() {
    // Show the current onboarding step
    if (this.currentStep >= this.onboardingSteps.length) {
      this.completeOnboarding();
      return;
    }
    
    const step = this.onboardingSteps[this.currentStep];
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    document.body.appendChild(overlay);
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'onboarding-tooltip';
    
    // Position tooltip
    if (step.target !== 'body') {
      const targetElement = document.querySelector(step.target);
      
      if (targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        
        switch (step.position) {
          case 'top':
            tooltip.style.bottom = `${window.innerHeight - targetRect.top + 10}px`;
            tooltip.style.left = `${targetRect.left + targetRect.width / 2}px`;
            tooltip.style.transform = 'translateX(-50%)';
            break;
          case 'right':
            tooltip.style.left = `${targetRect.right + 10}px`;
            tooltip.style.top = `${targetRect.top + targetRect.height / 2}px`;
            tooltip.style.transform = 'translateY(-50%)';
            break;
          case 'bottom':
            tooltip.style.top = `${targetRect.bottom + 10}px`;
            tooltip.style.left = `${targetRect.left + targetRect.width / 2}px`;
            tooltip.style.transform = 'translateX(-50%)';
            break;
          case 'left':
            tooltip.style.right = `${window.innerWidth - targetRect.left + 10}px`;
            tooltip.style.top = `${targetRect.top + targetRect.height / 2}px`;
            tooltip.style.transform = 'translateY(-50%)';
            break;
          default:
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
        }
        
        // Highlight target element
        targetElement.style.position = 'relative';
        targetElement.style.zIndex = UXConstants.zIndex[30];
        targetElement.style.boxShadow = `0 0 0 4px ${UXConstants.colors.primary[500]}`;
      } else {
        // Fallback to center if target not found
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
      }
    } else {
      // Center tooltip for body target
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
    }
    
    // Add content to tooltip
    tooltip.innerHTML = `
      <div class="onboarding-tooltip-title">${step.title}</div>
      <div class="onboarding-tooltip-content">${step.content}</div>
      <div class="onboarding-tooltip-buttons">
        ${this.currentStep > 0 ? '<button class="onboarding-button onboarding-button-secondary onboarding-prev">Previous</button>' : '<div></div>'}
        <button class="onboarding-button onboarding-button-primary onboarding-next">${this.currentStep < this.onboardingSteps.length - 1 ? 'Next' : 'Finish'}</button>
      </div>
      <div class="onboarding-progress">
        ${this.onboardingSteps.map((_, index) => `
          <div class="onboarding-progress-dot ${index === this.currentStep ? 'active' : ''}"></div>
        `).join('')}
      </div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Add event listeners
    const nextButton = tooltip.querySelector('.onboarding-next');
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        this.nextOnboardingStep();
      });
    }
    
    const prevButton = tooltip.querySelector('.onboarding-prev');
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        this.previousOnboardingStep();
      });
    }
  }
  
  nextOnboardingStep() {
    // Go to the next onboarding step
    this.clearOnboardingElements();
    this.currentStep++;
    this.showOnboardingStep();
  }
  
  previousOnboardingStep() {
    // Go to the previous onboarding step
    this.clearOnboardingElements();
    this.currentStep--;
    this.showOnboardingStep();
  }
  
  clearOnboardingElements() {
    // Clear onboarding elements
    const overlay = document.querySelector('.onboarding-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    const tooltip = document.querySelector('.onboarding-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
    
    // Reset highlighted elements
    const highlighted = document.querySelectorAll('[style*="z-index"][style*="box-shadow"]');
    highlighted.forEach(element => {
      element.style.position = '';
      element.style.zIndex = '';
      element.style.boxShadow = '';
    });
  }
  
  completeOnboarding() {
    // Complete the onboarding process
    this.clearOnboardingElements();
    
    // Mark user as onboarded
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('plateOrderSystemOnboarded', 'true');
    }
    
    this.firstTimeUser = false;
    
    return {
      success: true,
      message: 'Onboarding completed'
    };
  }
  
  resetOnboarding() {
    // Reset onboarding status
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('plateOrderSystemOnboarded');
    }
    
    this.firstTimeUser = true;
    
    return {
      success: true,
      message: 'Onboarding reset'
    };
  }
  
  addContextualHelp(element, content) {
    // Add contextual help to an element
    if (element && this.contextualHelpEnabled) {
      // Create help icon
      const helpIcon = document.createElement('span');
      helpIcon.className = 'contextual-help-icon';
      helpIcon.textContent = '?';
      
      // Create help content
      const helpContent = document.createElement('div');
      helpContent.className = 'contextual-help-content';
      helpContent.textContent = content;
      
      // Add to element
      element.style.position = 'relative';
      element.appendChild(helpIcon);
      element.appendChild(helpContent);
    }
  }
}

// Export the UX optimization components
export {
  UXConstants,
  AccessibilityManager,
  TouchOptimizer,
  ErrorPreventionManager,
  OnboardingManager
};
