"""
Test suite for front-of-house functionality in the Plate Order System.

This module contains comprehensive tests for the front-of-house components,
focusing on server workflows, table management, and order processing.
"""

import unittest
import os
import sys
import json
from unittest.mock import MagicMock, patch

# Add application to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import front-of-house components
from app.domain.services.order_service import OrderService
from app.domain.services.table_service import TableService
from app.domain.services.resident_service import ResidentService
from app.api.v1.endpoints.orders import create_order, get_orders, update_order


class TestFrontOfHouseWorkflows(unittest.TestCase):
    """Test cases for front-of-house workflows."""

    def setUp(self):
        """Set up test environment before each test."""
        # Mock configuration
        self.config = {
            'ENABLE_DIETARY_CHECKS': True,
            'ENABLE_RESIDENT_PROFILES': True
        }
        
        # Sample table data
        self.tables = [
            {'id': 1, 'number': 1, 'status': 'available', 'capacity': 4, 'section': 'main'},
            {'id': 2, 'number': 2, 'status': 'occupied', 'capacity': 2, 'section': 'main'},
            {'id': 3, 'number': 3, 'status': 'reserved', 'capacity': 6, 'section': 'private'}
        ]
        
        # Sample resident data
        self.residents = [
            {
                'id': 101, 
                'name': 'John Smith', 
                'table_number': 2,
                'dietary_restrictions': ['no salt', 'low sugar'],
                'preferences': {'favorite_drink': 'water', 'meal_size': 'small'},
                'care_needs': {'feeding_assistance': True}
            },
            {
                'id': 102, 
                'name': 'Mary Johnson', 
                'table_number': 2,
                'dietary_restrictions': ['gluten free', 'dairy free'],
                'preferences': {'favorite_drink': 'tea', 'meal_size': 'regular'},
                'care_needs': {'feeding_assistance': False}
            }
        ]
        
        # Sample order data
        self.orders = [
            {
                'id': 1001,
                'table_number': 2,
                'items': [
                    {'name': 'Chicken Salad', 'modifications': ['no dressing'], 'quantity': 1},
                    {'name': 'Water', 'modifications': ['with lemon'], 'quantity': 2}
                ],
                'status': 'new',
                'created_at': '2025-04-06T10:30:00Z',
                'server_id': 'server1'
            }
        ]

    @patch('app.domain.services.table_service.TableRepository')
    def test_table_service_get_tables(self, mock_table_repo):
        """Test retrieving tables from the table service."""
        # Configure mock
        mock_repo = MagicMock()
        mock_repo.get_all.return_value = self.tables
        mock_table_repo.return_value = mock_repo
        
        # Initialize service
        service = TableService()
        
        # Test getting all tables
        result = service.get_tables()
        
        # Verify results
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]['number'], 1)
        self.assertEqual(result[1]['status'], 'occupied')
        
        # Verify repository was called
        mock_repo.get_all.assert_called_once()

    @patch('app.domain.services.table_service.TableRepository')
    def test_table_service_update_table_status(self, mock_table_repo):
        """Test updating table status."""
        # Configure mock
        mock_repo = MagicMock()
        mock_repo.get_by_number.return_value = self.tables[0]
        mock_repo.update.return_value = {**self.tables[0], 'status': 'occupied'}
        mock_table_repo.return_value = mock_repo
        
        # Initialize service
        service = TableService()
        
        # Test updating table status
        result = service.update_table_status(1, 'occupied')
        
        # Verify results
        self.assertEqual(result['status'], 'occupied')
        
        # Verify repository was called correctly
        mock_repo.get_by_number.assert_called_once_with(1)
        mock_repo.update.assert_called_once()

    @patch('app.domain.services.resident_service.ResidentRepository')
    def test_resident_service_get_residents_at_table(self, mock_resident_repo):
        """Test retrieving residents at a specific table."""
        # Configure mock
        mock_repo = MagicMock()
        mock_repo.get_by_table_number.return_value = self.residents
        mock_resident_repo.return_value = mock_repo
        
        # Initialize service
        service = ResidentService()
        
        # Test getting residents at table
        result = service.get_residents_at_table(2)
        
        # Verify results
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['name'], 'John Smith')
        self.assertEqual(result[1]['name'], 'Mary Johnson')
        
        # Verify repository was called correctly
        mock_repo.get_by_table_number.assert_called_once_with(2)

    @patch('app.domain.services.resident_service.ResidentRepository')
    def test_resident_service_check_dietary_restrictions(self, mock_resident_repo):
        """Test checking dietary restrictions for residents."""
        # Configure mock
        mock_repo = MagicMock()
        mock_repo.get_by_table_number.return_value = self.residents
        mock_resident_repo.return_value = mock_repo
        
        # Initialize service
        service = ResidentService()
        
        # Test checking dietary restrictions
        order_items = [
            {'name': 'Chicken Salad with Ranch Dressing', 'modifications': [], 'quantity': 1},
            {'name': 'Whole Milk', 'modifications': [], 'quantity': 1}
        ]
        
        result = service.check_dietary_restrictions(2, order_items)
        
        # Verify results
        self.assertTrue(len(result) > 0)
        self.assertIn('dairy', str(result).lower())
        self.assertIn('mary johnson', str(result).lower())
        
        # Verify repository was called correctly
        mock_repo.get_by_table_number.assert_called_once_with(2)

    @patch('app.domain.services.order_service.OrderRepository')
    @patch('app.domain.services.order_service.ResidentService')
    def test_order_service_create_order(self, mock_resident_service, mock_order_repo):
        """Test creating an order with the order service."""
        # Configure mocks
        mock_repo = MagicMock()
        mock_repo.create.return_value = self.orders[0]
        mock_order_repo.return_value = mock_repo
        
        mock_resident = MagicMock()
        mock_resident.check_dietary_restrictions.return_value = []
        mock_resident_service.return_value = mock_resident
        
        # Initialize service
        service = OrderService()
        
        # Test creating an order
        order_data = {
            'table_number': 2,
            'items': [
                {'name': 'Chicken Salad', 'modifications': ['no dressing'], 'quantity': 1},
                {'name': 'Water', 'modifications': ['with lemon'], 'quantity': 2}
            ],
            'server_id': 'server1'
        }
        
        result = service.create_order(order_data)
        
        # Verify results
        self.assertEqual(result['id'], 1001)
        self.assertEqual(result['table_number'], 2)
        self.assertEqual(len(result['items']), 2)
        
        # Verify repository was called correctly
        mock_repo.create.assert_called_once()
        mock_resident.check_dietary_restrictions.assert_called_once()

    @patch('app.domain.services.order_service.OrderRepository')
    def test_order_service_get_orders_for_table(self, mock_order_repo):
        """Test retrieving orders for a specific table."""
        # Configure mock
        mock_repo = MagicMock()
        mock_repo.get_by_table_number.return_value = self.orders
        mock_order_repo.return_value = mock_repo
        
        # Initialize service
        service = OrderService()
        
        # Test getting orders for table
        result = service.get_orders_for_table(2)
        
        # Verify results
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['id'], 1001)
        
        # Verify repository was called correctly
        mock_repo.get_by_table_number.assert_called_once_with(2)

    @patch('app.domain.services.order_service.OrderRepository')
    def test_order_service_update_order_status(self, mock_order_repo):
        """Test updating order status."""
        # Configure mock
        mock_repo = MagicMock()
        mock_repo.get_by_id.return_value = self.orders[0]
        mock_repo.update.return_value = {**self.orders[0], 'status': 'in-progress'}
        mock_order_repo.return_value = mock_repo
        
        # Initialize service
        service = OrderService()
        
        # Test updating order status
        result = service.update_order_status(1001, 'in-progress')
        
        # Verify results
        self.assertEqual(result['status'], 'in-progress')
        
        # Verify repository was called correctly
        mock_repo.get_by_id.assert_called_once_with(1001)
        mock_repo.update.assert_called_once()

    @patch('app.api.v1.endpoints.orders.OrderService')
    def test_create_order_endpoint(self, mock_order_service):
        """Test the create order API endpoint."""
        # Configure mock
        mock_service = MagicMock()
        mock_service.create_order.return_value = self.orders[0]
        mock_order_service.return_value = mock_service
        
        # Test request data
        request_data = {
            'table_number': 2,
            'items': [
                {'name': 'Chicken Salad', 'modifications': ['no dressing'], 'quantity': 1},
                {'name': 'Water', 'modifications': ['with lemon'], 'quantity': 2}
            ],
            'server_id': 'server1'
        }
        
        # Process request
        response = create_order(request_data)
        
        # Verify results
        self.assertEqual(response['id'], 1001)
        self.assertEqual(response['table_number'], 2)
        
        # Verify service was called correctly
        mock_service.create_order.assert_called_once_with(request_data)

    @patch('app.api.v1.endpoints.orders.OrderService')
    def test_get_orders_endpoint(self, mock_order_service):
        """Test the get orders API endpoint."""
        # Configure mock
        mock_service = MagicMock()
        mock_service.get_orders.return_value = self.orders
        mock_order_service.return_value = mock_service
        
        # Process request
        response = get_orders()
        
        # Verify results
        self.assertEqual(len(response), 1)
        self.assertEqual(response[0]['id'], 1001)
        
        # Verify service was called correctly
        mock_service.get_orders.assert_called_once()

    @patch('app.api.v1.endpoints.orders.OrderService')
    def test_update_order_endpoint(self, mock_order_service):
        """Test the update order API endpoint."""
        # Configure mock
        mock_service = MagicMock()
        mock_service.update_order.return_value = {**self.orders[0], 'status': 'in-progress'}
        mock_order_service.return_value = mock_service
        
        # Test request data
        request_data = {
            'id': 1001,
            'status': 'in-progress'
        }
        
        # Process request
        response = update_order(1001, request_data)
        
        # Verify results
        self.assertEqual(response['id'], 1001)
        self.assertEqual(response['status'], 'in-progress')
        
        # Verify service was called correctly
        mock_service.update_order.assert_called_once_with(1001, request_data)

    @patch('app.domain.services.order_service.OrderRepository')
    @patch('app.domain.services.order_service.WebsocketManager')
    def test_order_service_real_time_updates(self, mock_websocket_manager, mock_order_repo):
        """Test real-time order updates via WebSockets."""
        # Configure mocks
        mock_repo = MagicMock()
        mock_repo.update.return_value = {**self.orders[0], 'status': 'in-progress'}
        mock_order_repo.return_value = mock_repo
        
        mock_ws = MagicMock()
        mock_websocket_manager.return_value = mock_ws
        
        # Initialize service
        service = OrderService()
        
        # Test updating order with real-time notification
        result = service.update_order_status(1001, 'in-progress')
        
        # Verify results
        self.assertEqual(result['status'], 'in-progress')
        
        # Verify WebSocket notification was sent
        mock_ws.broadcast_to_kitchen.assert_called_once()
        mock_ws.broadcast_to_table.assert_called_once()


if __name__ == '__main__':
    unittest.main()
