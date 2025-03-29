describe('WebSocketManager', () => {
    let wsManager;
    let mockWebSocket;
    
    beforeEach(() => {
        // Mock WebSocket
        mockWebSocket = {
            send: jest.fn(),
            close: jest.fn(),
            readyState: 0,
            onopen: null,
            onclose: null,
            onerror: null,
            onmessage: null
        };
        global.WebSocket = jest.fn(() => mockWebSocket);
        
        // Create WebSocketManager instance
        wsManager = new WebSocketManager('ws://test.com');
    });
    
    afterEach(() => {
        jest.clearAllMocks();
        wsManager.stopHeartbeat();
    });
    
    test('should initialize with correct properties', () => {
        expect(wsManager.url).toBe('ws://test.com');
        expect(wsManager.reconnectAttempts).toBe(0);
        expect(wsManager.maxReconnectAttempts).toBe(5);
        expect(wsManager.isConnected).toBe(false);
    });
    
    test('should connect successfully', () => {
        wsManager.connect();
        
        expect(WebSocket).toHaveBeenCalledWith('ws://test.com');
        expect(mockWebSocket.onopen).toBeDefined();
        expect(mockWebSocket.onclose).toBeDefined();
        expect(mockWebSocket.onerror).toBeDefined();
        expect(mockWebSocket.onmessage).toBeDefined();
    });
    
    test('should handle successful connection', () => {
        wsManager.connect();
        mockWebSocket.onopen();
        
        expect(wsManager.isConnected).toBe(true);
        expect(wsManager.reconnectAttempts).toBe(0);
    });
    
    test('should handle disconnection', () => {
        wsManager.connect();
        mockWebSocket.onopen();
        mockWebSocket.onclose({ code: 1000 });
        
        expect(wsManager.isConnected).toBe(false);
        expect(wsManager.reconnectAttempts).toBe(1);
    });
    
    test('should handle message sending', () => {
        wsManager.connect();
        mockWebSocket.onopen();
        
        const testMessage = { type: 'test', data: 'test data' };
        wsManager.sendMessage(testMessage);
        
        expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(testMessage));
    });
    
    test('should handle message receiving', () => {
        const testHandler = jest.fn();
        wsManager.registerHandler('test', testHandler);
        wsManager.connect();
        
        const testMessage = { type: 'test', data: 'test data' };
        mockWebSocket.onmessage({ data: JSON.stringify(testMessage) });
        
        expect(testHandler).toHaveBeenCalledWith(testMessage);
    });
    
    test('should handle heartbeat', () => {
        jest.useFakeTimers();
        wsManager.connect();
        mockWebSocket.onopen();
        
        // Trigger heartbeat
        jest.advanceTimersByTime(30000);
        
        expect(mockWebSocket.send).toHaveBeenCalledWith(
            expect.stringContaining('"type":"heartbeat"')
        );
        
        jest.useRealTimers();
    });
    
    test('should handle connection timeout', () => {
        jest.useFakeTimers();
        wsManager.connect();
        
        // Trigger timeout
        jest.advanceTimersByTime(10000);
        
        expect(mockWebSocket.close).toHaveBeenCalled();
        
        jest.useRealTimers();
    });
    
    test('should handle max reconnection attempts', () => {
        wsManager.connect();
        
        // Simulate multiple disconnections
        for (let i = 0; i < 5; i++) {
            mockWebSocket.onclose({ code: 1000 });
        }
        
        // Check if notification is created
        const notification = document.querySelector('.connection-error');
        expect(notification).toBeTruthy();
    });
    
    test('should handle invalid message format', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation();
        wsManager.connect();
        
        mockWebSocket.onmessage({ data: 'invalid json' });
        
        expect(consoleError).toHaveBeenCalledWith(
            expect.stringContaining('Error handling message')
        );
        
        consoleError.mockRestore();
    });
}); 