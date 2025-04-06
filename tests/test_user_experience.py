"""
Test suite for user experience and accessibility in the Plate Order System.

This module contains comprehensive tests for the user experience components,
focusing on accessibility, touch optimization, and error prevention.
"""

import unittest
import os
import sys
import json
from unittest.mock import MagicMock, patch

# Add application to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import UX components
from app.static.js.ux_optimization import AccessibilityManager, TouchOptimizer, ErrorPreventionManager, OnboardingManager


class TestUserExperience(unittest.TestCase):
    """Test cases for user experience functionality."""

    def setUp(self):
        """Set up test environment before each test."""
        # Mock window and document objects for browser environment
        self.window_mock = MagicMock()
        self.document_mock = MagicMock()
        
        # Mock localStorage
        self.local_storage = {}
        
        # Mock navigator for device detection
        self.navigator_mock = MagicMock()
        
        # Set up patch for browser environment
        self.patches = [
            patch('app.static.js.ux_optimization.window', self.window_mock),
            patch('app.static.js.ux_optimization.document', self.document_mock),
            patch('app.static.js.ux_optimization.localStorage', self.local_storage),
            patch('app.static.js.ux_optimization.navigator', self.navigator_mock)
        ]
        
        for p in self.patches:
            p.start()

    def tearDown(self):
        """Clean up after each test."""
        for p in self.patches:
            p.stop()

    def test_accessibility_manager_initialization(self):
        """Test initialization of accessibility manager."""
        # Configure mocks
        self.window_mock.matchMedia.return_value.matches = True
        
        # Initialize accessibility manager
        manager = AccessibilityManager()
        
        # Verify initialization
        self.assertTrue(manager.reducedMotion)
        self.assertTrue(manager.keyboardNavigationEnabled)
        self.assertFalse(manager.highContrastMode)
        self.assertFalse(manager.largeTextMode)
        
        # Verify methods were called
        self.document_mock.documentElement.classList.add.assert_called_with('reduced-motion')

    def test_accessibility_manager_toggle_features(self):
        """Test toggling accessibility features."""
        # Initialize accessibility manager
        manager = AccessibilityManager()
        
        # Test toggling high contrast mode
        result = manager.toggleHighContrastMode()
        self.assertTrue(result['success'])
        self.assertTrue(manager.highContrastMode)
        self.document_mock.documentElement.classList.add.assert_called_with('high-contrast-mode')
        
        # Test toggling large text mode
        result = manager.toggleLargeTextMode()
        self.assertTrue(result['success'])
        self.assertTrue(manager.largeTextMode)
        self.document_mock.documentElement.classList.add.assert_called_with('large-text-mode')
        
        # Test toggling reduced motion
        manager.reducedMotion = True
        result = manager.toggleReducedMotion()
        self.assertTrue(result['success'])
        self.assertFalse(manager.reducedMotion)
        self.document_mock.documentElement.classList.remove.assert_called_with('reduced-motion')

    def test_accessibility_manager_screen_reader_support(self):
        """Test screen reader support features."""
        # Initialize accessibility manager with screen reader optimization
        manager = AccessibilityManager(screenReaderOptimized=True)
        
        # Test screen reader announcement
        result = manager.announceToScreenReader("Order submitted successfully")
        self.assertTrue(result['success'])
        self.assertEqual(result['announcement'], "Order submitted successfully")

    def test_touch_optimizer_ios_detection(self):
        """Test iOS device detection in touch optimizer."""
        # Configure navigator mock for iOS
        self.navigator_mock.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        self.window_mock.MSStream = None
        
        # Initialize touch optimizer
        optimizer = TouchOptimizer()
        
        # Verify iOS detection
        self.assertTrue(optimizer.iosDevice)
        self.assertTrue(optimizer.touchEnabled)
        
        # Verify iOS-specific optimizations were applied
        self.document_mock.body.classList.add.assert_any_call('ios-device')

    def test_touch_optimizer_gesture_recognition(self):
        """Test gesture recognition in touch optimizer."""
        # Initialize touch optimizer
        optimizer = TouchOptimizer()
        
        # Mock touch events
        start_event = MagicMock()
        start_event.touches = [MagicMock(clientX=100, clientY=100)]
        start_event.target = MagicMock()
        
        move_event = MagicMock()
        move_event.touches = [MagicMock(clientX=150, clientY=100)]
        
        end_event = MagicMock()
        end_event.changedTouches = [MagicMock(clientX=200, clientY=100)]
        
        # Simulate touch sequence
        optimizer.handleTouchStart(start_event)
        self.assertEqual(optimizer.touchState.startX, 100)
        self.assertEqual(optimizer.touchState.startY, 100)
        
        optimizer.handleTouchMove(move_event)
        
        # Mock current time for swipe detection
        optimizer.touchState.startTime = 0
        with patch('app.static.js.ux_optimization.Date.now', return_value=200):
            optimizer.handleTouchEnd(end_event)
        
        # Verify swipe was detected
        start_event.target.dispatchEvent.assert_called_once()
        self.assertIn('swipe', str(start_event.target.dispatchEvent.call_args))
        self.assertIn('right', str(start_event.target.dispatchEvent.call_args))

    def test_error_prevention_manager_form_validation(self):
        """Test form validation in error prevention manager."""
        # Initialize error prevention manager
        manager = ErrorPreventionManager()
        
        # Mock form element and its elements
        form_element = MagicMock()
        input_element = MagicMock()
        input_element.type = 'text'
        input_element.name = 'orderItem'
        input_element.validity.valid = False
        input_element.validity.valueMissing = True
        input_element.parentNode = MagicMock()
        
        form_element.elements = [input_element]
        form_element.checkValidity.return_value = False
        
        # Test form validation
        result = manager.validateForm(form_element)
        
        # Verify validation results
        self.assertFalse(result['success'])
        self.assertEqual(len(result['errors']), 1)
        self.assertEqual(result['errors'][0]['element'], input_element)
        self.assertIn('required', result['errors'][0]['message'])
        
        # Verify validation message was added
        input_element.parentNode.appendChild.assert_called_once()
        self.assertIn('validation-message', str(input_element.parentNode.appendChild.call_args))

    def test_error_prevention_manager_confirmation(self):
        """Test confirmation dialogs in error prevention manager."""
        # Initialize error prevention manager
        manager = ErrorPreventionManager()
        
        # Mock window.confirm
        self.window_mock.confirm.return_value = True
        
        # Test confirmation dialog
        result = manager.confirmAction("Are you sure you want to delete this order?", {'id': 1001})
        
        # Verify confirmation was shown
        self.window_mock.confirm.assert_called_once_with("Are you sure you want to delete this order?")
        
        # Verify result handling
        self.assertIsInstance(result, MagicMock)  # In real code this would be a Promise

    def test_error_prevention_manager_undo_redo(self):
        """Test undo/redo functionality in error prevention manager."""
        # Initialize error prevention manager
        manager = ErrorPreventionManager()
        
        # Record some actions
        manager.recordAction('createOrder', {'id': 1001, 'items': ['Chicken Salad']})
        manager.recordAction('updateOrder', {'id': 1001, 'items': ['Chicken Salad', 'Water']})
        
        # Verify stack state
        self.assertEqual(len(manager.undoStack), 2)
        self.assertEqual(len(manager.redoStack), 0)
        
        # Test undo
        result = manager.undo()
        self.assertTrue(result['success'])
        self.assertEqual(result['action']['action'], 'updateOrder')
        self.assertEqual(len(manager.undoStack), 1)
        self.assertEqual(len(manager.redoStack), 1)
        
        # Test redo
        result = manager.redo()
        self.assertTrue(result['success'])
        self.assertEqual(result['action']['action'], 'updateOrder')
        self.assertEqual(len(manager.undoStack), 2)
        self.assertEqual(len(manager.redoStack), 0)

    def test_onboarding_manager_first_time_detection(self):
        """Test first-time user detection in onboarding manager."""
        # Test with no localStorage entry
        manager = OnboardingManager()
        self.assertTrue(manager.firstTimeUser)
        
        # Test with existing localStorage entry
        self.local_storage['plateOrderSystemOnboarded'] = 'true'
        manager = OnboardingManager()
        self.assertFalse(manager.firstTimeUser)

    def test_onboarding_manager_step_navigation(self):
        """Test onboarding step navigation."""
        # Initialize onboarding manager
        manager = OnboardingManager()
        
        # Mock clearOnboardingElements to avoid DOM manipulation
        manager.clearOnboardingElements = MagicMock()
        manager.showOnboardingStep = MagicMock()
        
        # Test navigation
        manager.currentStep = 1
        manager.nextOnboardingStep()
        self.assertEqual(manager.currentStep, 2)
        manager.clearOnboardingElements.assert_called_once()
        manager.showOnboardingStep.assert_called_once()
        
        manager.clearOnboardingElements.reset_mock()
        manager.showOnboardingStep.reset_mock()
        
        manager.previousOnboardingStep()
        self.assertEqual(manager.currentStep, 1)
        manager.clearOnboardingElements.assert_called_once()
        manager.showOnboardingStep.assert_called_once()

    def test_onboarding_manager_completion(self):
        """Test onboarding completion."""
        # Initialize onboarding manager
        manager = OnboardingManager()
        
        # Mock clearOnboardingElements to avoid DOM manipulation
        manager.clearOnboardingElements = MagicMock()
        
        # Test completion
        result = manager.completeOnboarding()
        self.assertTrue(result['success'])
        self.assertFalse(manager.firstTimeUser)
        self.assertEqual(self.local_storage['plateOrderSystemOnboarded'], 'true')
        manager.clearOnboardingElements.assert_called_once()

    def test_onboarding_manager_reset(self):
        """Test onboarding reset."""
        # Set initial state
        self.local_storage['plateOrderSystemOnboarded'] = 'true'
        
        # Initialize onboarding manager
        manager = OnboardingManager()
        self.assertFalse(manager.firstTimeUser)
        
        # Test reset
        result = manager.resetOnboarding()
        self.assertTrue(result['success'])
        self.assertTrue(manager.firstTimeUser)
        self.assertNotIn('plateOrderSystemOnboarded', self.local_storage)


if __name__ == '__main__':
    unittest.main()
