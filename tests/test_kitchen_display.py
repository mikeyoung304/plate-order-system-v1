"""
Test suite for kitchen display system functionality in the Plate Order System.

This module contains comprehensive tests for the kitchen display system components,
focusing on order management, prioritization, and real-time updates.
"""

import unittest
import os
import sys
import json
from unittest.mock import MagicMock, patch

# Add application to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import kitchen display system components
from app.domain.services.kitchen_service import KitchenService
from app.domain.services.order_service import OrderService
from app.websockets.connection_manager import WebsocketManager
from app.api.v1.endpoints.kitchen import get_kitchen_orders, update_order_status


class TestKitchenDisplaySystem(unittest.TestCase):
    """Test cases for kitchen display system functionality."""

    def setUp(self):
        """Set up test environment before each test."""
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
                'server_id': 'server1',
                'priority': 'normal',
                'estimated_prep_time': 8
            },
            {
                'id': 1002,
                'table_number': 3,
                'items': [
                    {'name': 'Vegetable Soup', 'modifications': ['extra hot'], 'quantity': 1},
                    {'name': 'Bread Roll', 'modifications': [], 'quantity': 1}
                ],
                'status': 'in-progress',
                'created_at': '2025-04-06T10:25:00Z',
                'server_id': 'server2',
                'priority': 'high',
                'estimated_prep_time': 12
            },
            {
                'id': 1003,
                'table_number': 5,
                'items': [
                    {'name': 'Turkey Sandwich', 'modifications': ['no mayo'], 'quantity': 1},
                    {'name': 'Fruit Cup', 'modifications': ['no melon'], 'quantity': 1}
                ],
                'status': 'ready',
                'created_at': '2025-04-06T10:15:00Z',
                'server_id': 'server1',
                'priority': 'normal',
                'estimated_prep_time': 5
            }
        ]
        
        # Sample resident dietary data
        self.resident_dietary = {
            2: [
                {
                    'id': 101,
                    'name': 'John Smith',
                    'dietary_restrictions': ['no salt', 'low sugar']
                }
            ],
            3: [
                {
                    'id': 102,
                    'name': 'Mary Johnson',
                    'dietary_restrictions': ['gluten free', 'dairy free']
                }
            ],
            5: [
                {
                    'id': 103,
                    'name': 'Robert Davis',
                    'dietary_restrictions': ['no nuts', 'diabetic']
                }
            ]
        }

    @patch('app.domain.services.kitchen_service.OrderRepository')
    def test_kitchen_service_get_active_orders(self, mock_order_repo):
        """Test retrieving active orders for the kitchen display."""
        # Configure mock
        mock_repo = MagicMock()
        mock_repo.get_by_status.return_value = self.orders[:2]  # new and in-progress orders
        mock_order_repo.return_value = mock_repo
        
        # Initialize service
        service = KitchenService()
        
        # Test getting active orders
        result = service.get_active_orders()
        
        # Verify results
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['id'], 1001)
        self.assertEqual(result[1]['id'], 1002)
        
        # Verify repository was called correctly
        mock_repo.get_by_status.assert_called_once()

    @patch('app.domain.services.kitchen_service.OrderRepository')
    def test_kitchen_service_order_prioritization(self, mock_order_repo):
        """Test order prioritization in the kitchen display."""
        # Configure mock
        mock_repo = MagicMock()
        mock_repo.get_by_status.return_value = self.orders[:2]  # new and in-progress orders
        mock_order_repo.return_value = mock_repo
        
        # Initialize service
        service = KitchenService()
        
        # Test getting prioritized orders
        result = service.get_prioritized_orders()
        
        # Verify results
        self.assertEqual(len(result), 2)
        # High priority order should be first
        self.assertEqual(result[0]['id'], 1002)
        self.assertEqual(result[0]['priority'], 'high')
        self.assertEqual(result[1]['id'], 1001)
        
        # Verify repository was called correctly
        mock_repo.get_by_status.assert_called_once()

    @patch('app.domain.services.kitchen_service.OrderRepository')
    @patch('app.domain.services.kitchen_service.ResidentService')
    def test_kitchen_service_dietary_information(self, mock_resident_service, mock_order_repo):
        """Test dietary information display in kitchen orders."""
        # Configure mocks
        mock_repo = MagicMock()
        mock_repo.get_by_id.return_value = self.orders[0]
        mock_order_repo.return_value = mock_repo
        
        mock_resident = MagicMock()
        mock_resident.get_residents_at_table.return_value = self.resident_dietary[2]
        mock_resident_service.return_value = mock_resident
        
        # Initialize service
        service = KitchenService()
        
        # Test getting order with dietary information
        result = service.get_order_with_dietary_info(1001)
        
        # Verify results
        self.assertEqual(result['id'], 1001)
        self.assertIn('dietary_info', result)
        self.assertEqual(result['dietary_info'][0]['name'], 'John Smith')
        self.assertIn('no salt', result['dietary_info'][0]['dietary_restrictions'])
        
        # Verify services were called correctly
        mock_repo.get_by_id.assert_called_once_with(1001)
        mock_resident.get_residents_at_table.assert_called_once_with(2)

    @patch('app.domain.services.kitchen_service.OrderRepository')
    def test_kitchen_service_update_order_status(self, mock_order_repo):
        """Test updating order status from the kitchen."""
        # Configure mock
        mock_repo = MagicMock()
        mock_repo.get_by_id.return_value = self.orders[0]
        mock_repo.update.return_value = {**self.orders[0], 'status': 'in-progress'}
        mock_order_repo.return_value = mock_repo
        
        # Initialize service
        service = KitchenService()
        
        # Test updating order status
        result = service.update_order_status(1001, 'in-progress')
        
        # Verify results
        self.assertEqual(result['status'], 'in-progress')
        
        # Verify repository was called correctly
        mock_repo.get_by_id.assert_called_once_with(1001)
        mock_repo.update.assert_called_once()

    @patch('app.domain.services.kitchen_service.OrderRepository')
    @patch('app.domain.services.kitchen_service.WebsocketManager')
    def test_kitchen_service_real_time_updates(self, mock_websocket_manager, mock_order_repo):
        """Test real-time updates for kitchen display."""
        # Configure mocks
        mock_repo = MagicMock()
        mock_repo.update.return_value = {**self.orders[0], 'status': 'in-progress'}
        mock_order_repo.return_value = mock_repo
        
        mock_ws = MagicMock()
        mock_websocket_manager.return_value = mock_ws
        
        # Initialize service
        service = KitchenService()
        
        # Test updating order with real-time notification
        result = service.update_order_status(1001, 'in-progress')
        
        # Verify results
        self.assertEqual(result['status'], 'in-progress')
        
        # Verify WebSocket notification was sent
        mock_ws.broadcast_to_kitchen.assert_called_once()
        mock_ws.broadcast_to_servers.assert_called_once()

    @patch('app.domain.services.kitchen_service.OrderRepository')
    def test_kitchen_service_workload_balancing(self, mock_order_repo):
        """Test workload balancing for kitchen stations."""
        # Configure mock
        mock_repo = MagicMock()
        mock_repo.get_by_status.return_value = self.orders
        mock_order_repo.return_value = mock_repo
        
        # Initialize service
        service = KitchenService()
        
        # Test getting workload distribution
        result = service.get_workload_distribution()
        
        # Verify results
        self.assertIn('stations', result)
        self.assertIn('total_prep_time', result)
        
        # Verify repository was called correctly
        mock_repo.get_by_status.assert_called_once()

    @patch('app.api.v1.endpoints.kitchen.KitchenService')
    def test_get_kitchen_orders_endpoint(self, mock_kitchen_service):
        """Test the get kitchen orders API endpoint."""
        # Configure mock
        mock_service = MagicMock()
        mock_service.get_prioritized_orders.return_value = [self.orders[1], self.orders[0]]
        mock_kitchen_service.return_value = mock_service
        
        # Process request
        response = get_kitchen_orders()
        
        # Verify results
        self.assertEqual(len(response), 2)
        self.assertEqual(response[0]['id'], 1002)  # High priority order first
        self.assertEqual(response[1]['id'], 1001)
        
        # Verify service was called correctly
        mock_service.get_prioritized_orders.assert_called_once()

    @patch('app.api.v1.endpoints.kitchen.KitchenService')
    def test_update_order_status_endpoint(self, mock_kitchen_service):
        """Test the update order status API endpoint."""
        # Configure mock
        mock_service = MagicMock()
        mock_service.update_order_status.return_value = {**self.orders[0], 'status': 'ready'}
        mock_kitchen_service.return_value = mock_service
        
        # Test request data
        request_data = {
            'status': 'ready'
        }
        
        # Process request
        response = update_order_status(1001, request_data)
        
        # Verify results
        self.assertEqual(response['id'], 1001)
        self.assertEqual(response['status'], 'ready')
        
        # Verify service was called correctly
        mock_service.update_order_status.assert_called_once_with(1001, 'ready')

    @patch('app.websockets.connection_manager.WebsocketManager.instance')
    def test_websocket_connection_manager(self, mock_instance):
        """Test WebSocket connection manager for real-time updates."""
        # Configure mock
        mock_instance.return_value = None
        
        # Initialize connection manager
        manager = WebsocketManager()
        
        # Add connections
        kitchen_connection = MagicMock()
        server_connection = MagicMock()
        table_connection = MagicMock()
        
        manager.add_kitchen_connection("kitchen1", kitchen_connection)
        manager.add_server_connection("server1", server_connection)
        manager.add_table_connection(2, table_connection)
        
        # Test broadcasting messages
        order_update = {
            'id': 1001,
            'table_number': 2,
            'status': 'ready',
            'updated_at': '2025-04-06T10:45:00Z'
        }
        
        manager.broadcast_to_kitchen(order_update)
        manager.broadcast_to_servers(order_update)
        manager.broadcast_to_table(2, order_update)
        
        # Verify messages were sent
        kitchen_connection.send_json.assert_called_once()
        server_connection.send_json.assert_called_once()
        table_connection.send_json.assert_called_once()
        
        # Test removing connections
        manager.remove_kitchen_connection("kitchen1")
        manager.remove_server_connection("server1")
        manager.remove_table_connection(2)
        
        # Verify connections were removed
        self.assertEqual(len(manager.kitchen_connections), 0)
        self.assertEqual(len(manager.server_connections), 0)
        self.assertEqual(len(manager.table_connections), 0)


if __name__ == '__main__':
    unittest.main()
