import logging
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Enhanced WebSocket connection manager for real-time communication.
    Supports multiple connection types and targeted messaging.
    """
    
    def __init__(self):
        """Initialize the connection manager with empty connection lists"""
        # Store active connections by type
        self.active_connections: Dict[str, List[WebSocket]] = {
            "kitchen": [],  # Kitchen display system connections
            "server": [],   # Server/staff connections
            "admin": [],    # Admin connections
            "general": []   # General connections
        }
        
        # Store connection metadata
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, connection_type: str = "general", metadata: Optional[Dict[str, Any]] = None):
        """
        Accept a WebSocket connection and add it to the appropriate connection list
        
        Args:
            websocket: The WebSocket connection
            connection_type: Type of connection (kitchen, server, admin, general)
            metadata: Optional metadata for the connection (e.g., user_id, table_id)
        """
        await websocket.accept()
        
        # Ensure connection_type is valid
        if connection_type not in self.active_connections:
            connection_type = "general"
            
        # Add to appropriate connection list
        self.active_connections[connection_type].append(websocket)
        
        # Store metadata
        if metadata:
            self.connection_metadata[websocket] = metadata
        else:
            self.connection_metadata[websocket] = {"type": connection_type}
            
        logger.info(f"New {connection_type} WebSocket connection established. "
                   f"Active connections: {self._count_connections()}")
    
    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection from all connection lists
        
        Args:
            websocket: The WebSocket connection to remove
        """
        # Remove from all connection lists
        for connection_type in self.active_connections:
            if websocket in self.active_connections[connection_type]:
                self.active_connections[connection_type].remove(websocket)
        
        # Log metadata before removal
        if websocket in self.connection_metadata:
            logger.info(f"Disconnecting {websocket} with metadata: {self.connection_metadata[websocket]}")
            del self.connection_metadata[websocket]
        
        logger.info(f"WebSocket connection closed. Active connections: {self._count_connections()}")
    
    async def send_personal_message(self, message: Any, websocket: WebSocket):
        """
        Send a message to a specific WebSocket connection
        
        Args:
            message: The message to send (can be text or JSON)
            websocket: The WebSocket connection to send to
        """
        try:
            if isinstance(message, str):
                await websocket.send_text(message)
            else:
                await websocket.send_json(message)
            logger.debug(f"Sent message to {websocket}: {message}")
        except Exception as e:
            logger.error(f"Error sending personal message to {websocket}: {str(e)}")
            raise  # Re-raise to let the caller handle
    
    async def broadcast(self, message: Any, connection_type: str = None, exclude: WebSocket = None):
        """
        Broadcast a message to all connections of a specific type
        
        Args:
            message: The message to send (can be text or JSON)
            connection_type: Type of connections to broadcast to (if None, broadcast to all)
            exclude: Optional WebSocket connection to exclude from broadcast
        """
        connection_types = [connection_type] if connection_type else list(self.active_connections.keys())
        
        for conn_type in connection_types:
            if conn_type in self.active_connections:
                for connection in self.active_connections[conn_type]:
                    if connection != exclude:
                        try:
                            if isinstance(message, str):
                                await connection.send_text(message)
                            else:
                                await connection.send_json(message)
                        except Exception as e:
                            logger.error(f"Error broadcasting message: {str(e)}")
                            # Don't disconnect here, let the main WebSocket handler handle disconnections
    
    async def broadcast_to_table(self, message: Any, table_id: int, exclude: WebSocket = None):
        """
        Broadcast a message to all connections associated with a specific table
        
        Args:
            message: The message to send (can be text or JSON)
            table_id: The table ID to broadcast to
            exclude: Optional WebSocket connection to exclude from broadcast
        """
        for connection, metadata in self.connection_metadata.items():
            if metadata.get("table_id") == table_id and connection != exclude:
                try:
                    if isinstance(message, str):
                        await connection.send_text(message)
                    else:
                        await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to table {table_id}: {str(e)}")
    
    async def broadcast_to_user(self, message: Any, user_id: int, exclude: WebSocket = None):
        """
        Broadcast a message to all connections associated with a specific user
        
        Args:
            message: The message to send (can be text or JSON)
            user_id: The user ID to broadcast to
            exclude: Optional WebSocket connection to exclude from broadcast
        """
        for connection, metadata in self.connection_metadata.items():
            if metadata.get("user_id") == user_id and connection != exclude:
                try:
                    if isinstance(message, str):
                        await connection.send_text(message)
                    else:
                        await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id}: {str(e)}")
    
    def _count_connections(self) -> Dict[str, int]:
        """
        Count active connections by type
        
        Returns:
            Dictionary with connection counts by type
        """
        return {conn_type: len(connections) for conn_type, connections in self.active_connections.items()}
    
    def get_connection_by_id(self, connection_id: str) -> Optional[WebSocket]:
        """
        Get a WebSocket connection by its ID in metadata
        
        Args:
            connection_id: The connection ID to look for
            
        Returns:
            The WebSocket connection if found, None otherwise
        """
        for connection, metadata in self.connection_metadata.items():
            if metadata.get("connection_id") == connection_id:
                return connection
        return None
    
    def get_connections_by_metadata(self, key: str, value: Any) -> List[WebSocket]:
        """
        Get all WebSocket connections with matching metadata
        
        Args:
            key: The metadata key to match
            value: The metadata value to match
            
        Returns:
            List of matching WebSocket connections
        """
        return [
            connection for connection, metadata in self.connection_metadata.items()
            if metadata.get(key) == value
        ]
