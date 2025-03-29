document.addEventListener('DOMContentLoaded', function() {
    // WebSocket connection management
    class WebSocketManager {
        constructor(url) {
            this.url = url;
            this.ws = null;
            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 5;
            this.reconnectDelay = 3000;
            this.heartbeatInterval = 30000; // 30 seconds
            this.heartbeatTimer = null;
            this.isConnected = false;
            this.messageHandlers = new Map();
            this.lastHeartbeat = Date.now();
            this.connectionTimeout = 10000; // 10 seconds
        }

        connect() {
            try {
                this.ws = new WebSocket(this.url);
                this.setupEventListeners();
                this.startHeartbeat();
                this.startConnectionTimeout();
                this.isConnected = true;
                this.reconnectAttempts = 0;
            } catch (error) {
                console.error('WebSocket connection error:', error);
                this.handleReconnect();
            }
        }

        setupEventListeners() {
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.lastHeartbeat = Date.now();
            };

            this.ws.onclose = (event) => {
                console.log(`WebSocket disconnected with code ${event.code}`);
                this.isConnected = false;
                this.stopHeartbeat();
                this.handleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
        }

        startConnectionTimeout() {
            setTimeout(() => {
                if (!this.isConnected) {
                    console.error('Connection timeout');
                    this.ws.close();
                }
            }, this.connectionTimeout);
        }

        handleReconnect() {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
                setTimeout(() => this.connect(), delay);
            } else {
                console.error('Max reconnection attempts reached');
                this.handleMaxReconnectAttemptsReached();
            }
        }

        startHeartbeat() {
            this.heartbeatTimer = setInterval(() => {
                if (this.isConnected) {
                    const now = Date.now();
                    if (now - this.lastHeartbeat > this.heartbeatInterval * 1.5) {
                        console.warn('No heartbeat received, reconnecting...');
                        this.ws.close();
                    } else {
                        this.sendMessage({ type: 'heartbeat', timestamp: now });
                    }
                }
            }, this.heartbeatInterval);
        }

        stopHeartbeat() {
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
        }

        sendMessage(data) {
            if (this.isConnected) {
                try {
                    const message = JSON.stringify(data);
                    this.ws.send(message);
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            }
        }

        handleMessage(data) {
            try {
                const message = JSON.parse(data);
                
                // Validate message structure
                if (!message || typeof message !== 'object') {
                    console.error('Invalid message format');
                    return;
                }

                // Handle heartbeat
                if (message.type === 'heartbeat') {
                    this.lastHeartbeat = Date.now();
                    console.log('Heartbeat received');
                    return;
                }

                // Handle registered message handlers
                const handler = this.messageHandlers.get(message.type);
                if (handler) {
                    handler(message);
                } else {
                    console.warn(`No handler registered for message type: ${message.type}`);
                }
            } catch (error) {
                console.error('Error handling message:', error);
            }
        }

        registerHandler(type, handler) {
            this.messageHandlers.set(type, handler);
        }

        handleMaxReconnectAttemptsReached() {
            // Notify user of connection issues
            const notification = document.createElement('div');
            notification.className = 'connection-error';
            notification.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Connection lost. Please refresh the page.
                </div>
                <button onclick="location.reload()">Refresh Page</button>
            `;
            document.body.appendChild(notification);

            // Remove notification after 30 seconds
            setTimeout(() => {
                notification.remove();
            }, 30000);
        }
    }

    // Initialize WebSocket connection
    const wsManager = new WebSocketManager(`ws://${window.location.host}/ws`);
    wsManager.connect();

    // Register message handlers
    wsManager.registerHandler('orderUpdate', (message) => {
        console.log('Order update received:', message);
        // Handle order updates
    });

    wsManager.registerHandler('error', (message) => {
        console.error('Server error:', message.error);
        // Handle server errors
    });

    // Simple placeholder logo - this would be replaced with your actual logo
    const logoSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 180" width="120">
            <path d="M360,90c0,33.137-26.863,60-60,60s-60-26.863-60-60s26.863-60,60-60S360,56.863,360,90z" fill="none" stroke="black" stroke-width="12"/>
            <text x="125" y="110" font-family="sans-serif" font-size="60" font-weight="bold">Plate.</text>
        </svg>
    `;
    document.getElementById('logo').outerHTML = logoSVG;
    
    // Set up role switching
    const roleBtns = document.querySelectorAll('.role-btn');
    const serverView = document.getElementById('server-view');
    const kitchenView = document.getElementById('kitchen-view');
    const adminView = document.getElementById('admin-view');
    
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            roleBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Show the appropriate view
            const role = btn.getAttribute('data-role');
            
            serverView.style.display = role === 'server' ? 'flex' : 'none';
            kitchenView.style.display = role === 'kitchen' ? 'flex' : 'none';
            adminView.style.display = role === 'admin' ? 'flex' : 'none';
        });
    });
    
    // Set up record button
    const recordBtn = document.getElementById('recordButton');
    const recordStatus = document.querySelector('.record-status');
    
    // Variable to store timeout ID
    let longPressTimeout;
    
    // Function to handle recording start
    const startRecording = () => {
        recordBtn.classList.add('recording');
        recordBtn.innerHTML = '<i class="fas fa-microphone-slash record-icon"></i> Release to stop recording';
        recordStatus.innerText = 'Recording...';
        
        // Here you would integrate with Deepgram API
        console.log('Recording started...');
    };
    
    // Function to handle recording stop
    const stopRecording = () => {
        recordBtn.classList.remove('recording');
        recordBtn.innerHTML = '<i class="fas fa-microphone record-icon"></i> Press and hold to record order';
        recordStatus.innerText = 'Processing...';
        
        // Here you would send the audio to Deepgram API
        console.log('Recording stopped, processing...');
        
        // Simulate processing delay
        setTimeout(() => {
            recordStatus.innerText = 'Order added: "One grilled salmon, no onions, extra sauce"';
            
            // Reset after a few seconds
            setTimeout(() => {
                recordStatus.innerText = 'Ready to record';
            }, 3000);
        }, 1500);
    };
    
    // Add event listeners for press and hold
    recordBtn.addEventListener('mousedown', () => {
        longPressTimeout = setTimeout(startRecording, 300);
    });
    
    recordBtn.addEventListener('mouseup', () => {
        clearTimeout(longPressTimeout);
        if (recordBtn.classList.contains('recording')) {
            stopRecording();
        }
    });
    
    recordBtn.addEventListener('mouseleave', () => {
        clearTimeout(longPressTimeout);
        if (recordBtn.classList.contains('recording')) {
            stopRecording();
        }
    });
    
    // Add touch events for mobile
    recordBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        longPressTimeout = setTimeout(startRecording, 300);
    });
    
    recordBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        clearTimeout(longPressTimeout);
        if (recordBtn.classList.contains('recording')) {
            stopRecording();
        }
    });
    
    // Table selection
    const tables = document.querySelectorAll('.table');
    
    tables.forEach(table => {
        table.addEventListener('click', () => {
            tables.forEach(t => {
                if (t !== table) {
                    t.classList.remove('selected');
                }
            });
            
            table.classList.toggle('selected');
        });
    });
    
    // Seat selection
    const seats = document.querySelectorAll('.seat');
    
    seats.forEach(seat => {
        seat.addEventListener('click', () => {
            seat.classList.toggle('selected');
        });
    });
    
    // KDS order card actions
    const actionBtns = document.querySelectorAll('.card-action-btn');
    
    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const orderCard = btn.closest('.order-card');
            
            if (btn.classList.contains('cooking')) {
                orderCard.classList.remove('new');
                orderCard.classList.add('cooking');
                btn.innerHTML = '<i class="fas fa-check"></i> Mark Ready';
                btn.classList.remove('cooking');
                btn.classList.add('ready');
            } else if (btn.classList.contains('ready')) {
                orderCard.classList.remove('cooking');
                orderCard.classList.add('ready');
                btn.innerHTML = '<i class="fas fa-hand-point-right"></i> Bump Order';
                btn.classList.remove('ready');
                btn.classList.add('bump');
            } else if (btn.classList.contains('bump')) {
                orderCard.style.opacity = '0';
                setTimeout(() => {
                    orderCard.style.display = 'none';
                }, 300);
            }
        });
    });
});
EOF