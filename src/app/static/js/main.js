document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const voiceOrderBtn = document.getElementById('voice-order-btn');
    const voiceModal = document.getElementById('voice-modal');
    const startRecordingBtn = document.getElementById('start-recording');
    const stopRecordingBtn = document.getElementById('stop-recording');
    const cancelOrderBtn = document.getElementById('cancel-order');
    const confirmOrderBtn = document.getElementById('confirm-order');
    const recordingStatus = document.getElementById('recording-status');
    const transcriptionContainer = document.getElementById('transcription-container');
    const processedOrderContainer = document.getElementById('processed-order-container');
    const transcriptionElement = document.getElementById('transcription');
    const processedOrderElement = document.getElementById('processed-order');
    const visualizer = document.getElementById('visualizer');
    const quickTableSelect = document.getElementById('quick-table');
    const quickInput = document.getElementById('quick-input');
    const quickSubmit = document.getElementById('quick-submit');
    const activeOrdersCount = document.getElementById('active-orders-count');
    const avgPrepTime = document.getElementById('avg-prep-time');
    const residentsCount = document.getElementById('residents-count');
    const completedOrdersCount = document.getElementById('completed-orders-count');
    const recentOrdersContainer = document.getElementById('recent-orders');
    const kdsPendingCount = document.getElementById('kds-pending-count');
    const kdsInProgressCount = document.getElementById('kds-inprogress-count');
    const kdsReadyCount = document.getElementById('kds-ready-count');
    const kdsItemsContainer = document.getElementById('kds-items');

    // Audio Recording Variables
    let mediaRecorder;
    let audioChunks = [];
    let audioContext;
    let analyser;
    let microphone;
    let canvasContext;
    let selectedTable = null;
    let visualizerInterval;

    // Initialize the application
    function init() {
        setupEventListeners();
        loadDashboardData();
        loadTablesForQuickOrder();
        setupWebSocketConnection();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Voice Order Modal
        voiceOrderBtn.addEventListener('click', openVoiceModal);
        startRecordingBtn.addEventListener('click', startRecording);
        stopRecordingBtn.addEventListener('click', stopRecording);
        cancelOrderBtn.addEventListener('click', closeVoiceModal);
        confirmOrderBtn.addEventListener('click', submitVoiceOrder);

        // Quick Order Form
        quickSubmit.addEventListener('click', submitQuickOrder);

        // Close modal when clicking outside
        voiceModal.addEventListener('click', (e) => {
            if (e.target === voiceModal) {
                closeVoiceModal();
            }
        });
    }

    // Load dashboard data
    function loadDashboardData() {
        // Fetch order statistics
        fetch('/api/orders/stats')
            .then(response => response.json())
            .then(data => {
                activeOrdersCount.textContent = data.active_count || 0;
                avgPrepTime.textContent = `${data.avg_prep_time || 0} min`;
                completedOrdersCount.textContent = data.completed_today || 0;

                // Update KDS summary
                kdsPendingCount.textContent = data.pending_count || 0;
                kdsInProgressCount.textContent = data.in_progress_count || 0;
                kdsReadyCount.textContent = data.ready_count || 0;
            })
            .catch(error => console.error('Error loading order stats:', error));

        // Fetch residents count
        fetch('/api/residents/count')
            .then(response => response.json())
            .then(data => {
                residentsCount.textContent = data.count || 0;
            })
            .catch(error => console.error('Error loading residents count:', error));

        // Load recent orders
        loadRecentOrders();

        // Load KDS summary items
        loadKdsSummary();
    }

    // Load recent orders
    function loadRecentOrders() {
        fetch('/api/orders?limit=6')
            .then(response => response.json())
            .then(orders => {
                recentOrdersContainer.innerHTML = '';
                
                if (orders.length === 0) {
                    recentOrdersContainer.innerHTML = '<p class="no-data">No recent orders</p>';
                    return;
                }

                orders.forEach(order => {
                    const orderCard = createOrderCard(order);
                    recentOrdersContainer.appendChild(orderCard);
                });
            })
            .catch(error => console.error('Error loading recent orders:', error));
    }

    // Create an order card element
    function createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.dataset.orderId = order.id;

        // Format timestamp
        const createdAt = new Date(order.created_at);
        const timeString = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Get table number from order details
        let tableNumber = 'N/A';
        const tableMatch = order.details.match(/Table (\d+):/);
        if (tableMatch) {
            tableNumber = tableMatch[1];
        }

        // Status color
        let statusClass = '';
        switch (order.status) {
            case 'pending': statusClass = 'status-pending'; break;
            case 'in_progress': statusClass = 'status-in-progress'; break;
            case 'ready': statusClass = 'status-ready'; break;
            case 'completed': statusClass = 'status-completed'; break;
            case 'cancelled': statusClass = 'status-cancelled'; break;
        }

        card.innerHTML = `
            <div class="order-header">
                <span>Table ${tableNumber}</span>
                <span class="status ${statusClass}">${order.status.replace('_', ' ')}</span>
            </div>
            <div class="order-details">
                <p>${order.details}</p>
                <div class="order-meta">
                    <span class="order-time"><i class="fas fa-clock"></i> ${timeString}</span>
                    ${order.flagged ? `<span class="order-flag"><i class="fas fa-flag"></i> Flagged</span>` : ''}
                </div>
            </div>
            <div class="order-actions">
                <button class="btn btn-small view-order" data-id="${order.id}">
                    <i class="fas fa-eye"></i> View
                </button>
                ${order.status === 'pending' ? `
                    <button class="btn btn-small cancel-order" data-id="${order.id}">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                ` : ''}
            </div>
        `;

        // Add event listeners to buttons
        const viewBtn = card.querySelector('.view-order');
        viewBtn.addEventListener('click', () => viewOrder(order.id));

        const cancelBtn = card.querySelector('.cancel-order');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => cancelOrder(order.id));
        }

        return card;
    }

    // Load KDS summary items
    function loadKdsSummary() {
        fetch('/api/orders?status=pending&status=in_progress&limit=5')
            .then(response => response.json())
            .then(orders => {
                kdsItemsContainer.innerHTML = '';
                
                if (orders.length === 0) {
                    kdsItemsContainer.innerHTML = '<p class="no-data">No active orders</p>';
                    return;
                }

                orders.forEach(order => {
                    const kdsItem = document.createElement('div');
                    kdsItem.className = 'kds-item';

                    // Status class
                    let statusClass = '';
                    switch (order.status) {
                        case 'pending': statusClass = 'status-pending'; break;
                        case 'in_progress': statusClass = 'status-in-progress'; break;
                        case 'ready': statusClass = 'status-ready'; break;
                    }

                    // Get table number from order details
                    let tableNumber = 'N/A';
                    const tableMatch = order.details.match(/Table (\d+):/);
                    if (tableMatch) {
                        tableNumber = tableMatch[1];
                    }

                    kdsItem.innerHTML = `
                        <span class="kds-item-table">Table ${tableNumber}</span>
                        <span class="kds-item-details">${order.details}</span>
                        <span class="kds-item-status ${statusClass}">${order.status.replace('_', ' ')}</span>
                    `;
                    
                    kdsItemsContainer.appendChild(kdsItem);
                });
            })
            .catch(error => console.error('Error loading KDS summary:', error));
    }

    // Load tables for quick order
    function loadTablesForQuickOrder() {
        fetch('/api/floor-plan/tables')
            .then(response => response.json())
            .then(tables => {
                quickTableSelect.innerHTML = '<option value="">Select Table</option>';
                
                if (Array.isArray(tables)) {
                    tables.forEach(table => {
                        const option = document.createElement('option');
                        option.value = table.id;
                        option.textContent = `Table ${table.number}`;
                        quickTableSelect.appendChild(option);
                    });
                } else {
                    console.error('Tables data is not an array:', tables);
                    // Fallback: Add some default tables
                    for (let i = 1; i <= 6; i++) {
                        const option = document.createElement('option');
                        option.value = i;
                        option.textContent = `Table ${i}`;
                        quickTableSelect.appendChild(option);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading tables:', error);
                // Fallback: Add some default tables
                for (let i = 1; i <= 6; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = `Table ${i}`;
                    quickTableSelect.appendChild(option);
                }
            });
    }

    // Open voice order modal
    function openVoiceModal(tableId = null) {
        selectedTable = tableId;
        voiceModal.classList.remove('hidden');
        resetVoiceModal();

        // Initialize visualizer
        canvasContext = visualizer.getContext('2d');
    }

    // Close voice order modal
    function closeVoiceModal() {
        voiceModal.classList.add('hidden');
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        stopVisualization();

        // Clean up audio resources
        if (audioContext) {
            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
            audioContext = null;
        }
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
    }

    // Reset the voice modal to initial state
    function resetVoiceModal() {
        startRecordingBtn.classList.remove('hidden');
        stopRecordingBtn.classList.add('hidden');
        transcriptionContainer.classList.add('hidden');
        processedOrderContainer.classList.add('hidden');
        recordingStatus.textContent = 'Press the button to start recording';
        transcriptionElement.textContent = '';
        processedOrderElement.textContent = '';
        confirmOrderBtn.classList.add('disabled');
        audioChunks = [];
    }

    // Start recording audio
    function startRecording() {
        if (!navigator.mediaDevices) {
            alert('Media devices not supported in this browser. Please try another browser.');
            return;
        }

        navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100
            } 
        })
            .then(stream => {
                // Show recording UI
                startRecordingBtn.classList.add('hidden');
                stopRecordingBtn.classList.remove('hidden');
                recordingStatus.textContent = 'Recording... Speak clearly';
                
                // Initialize audio context for visualization
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                
                // Configure analyser
                analyser.fftSize = 256;
                microphone.connect(analyser);
                
                // Start visualization
                startVisualization();
                
                // Create media recorder
                mediaRecorder = new MediaRecorder(stream);
                
                // Handle data available event
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };
                
                // Handle recording stopped
                mediaRecorder.onstop = () => {
                    stopVisualization();
                    recordingStatus.textContent = 'Processing...';
                    
                    // Convert audio chunks to base64
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    
                    reader.onloadend = () => {
                        const base64Audio = reader.result.split(',')[1];
                        processAudio(base64Audio);
                    };
                    
                    reader.readAsDataURL(audioBlob);
                    
                    // Stop all audio tracks
                    stream.getTracks().forEach(track => track.stop());
                };
                
                // Start recording
                mediaRecorder.start();
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                recordingStatus.textContent = 'Error: Could not access microphone';
                alert('Could not access microphone. Please check permissions and try again.');
            });
    }

    // Stop recording audio
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            stopRecordingBtn.classList.add('hidden');
        }
    }

    // Start audio visualization
    function startVisualization() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const width = visualizer.width;
        const height = visualizer.height;
        
        canvasContext.clearRect(0, 0, width, height);
        
        visualizerInterval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            
            canvasContext.fillStyle = 'rgb(255, 255, 255)';
            canvasContext.fillRect(0, 0, width, height);
            
            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 255 * height;
                
                canvasContext.fillStyle = `rgb(${dataArray[i]}, 134, 244)`;
                canvasContext.fillRect(x, height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        }, 50);
    }

    // Stop audio visualization
    function stopVisualization() {
        if (visualizerInterval) {
            clearInterval(visualizerInterval);
            visualizerInterval = null;
        }
        
        // Clear canvas
        if (canvasContext) {
            canvasContext.clearRect(0, 0, visualizer.width, visualizer.height);
        }
    }

    // Process recorded audio
    function processAudio(base64Audio) {
        // Show processing state
        recordingStatus.textContent = 'Processing...';
        
        // Convert base64 back to a Blob for the new API
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/webm' });
        
        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        
        console.log('Sending audio data to transcription service');
        
        // First, get transcription from our new speech service
        fetch('/api/speech/transcribe', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    console.error('API Error:', err);
                    throw new Error(err.detail || 'Network response was not ok');
                });
            }
            return response.json();
        })
        .then(transcriptionData => {
            // Show transcription
            transcriptionContainer.classList.remove('hidden');
            const transcriptionText = transcriptionData.text || 'No transcription returned';
            transcriptionElement.textContent = transcriptionText;
            
            // Add table number if selected
            let tableId = 1; // Default to table 1
            if (selectedTable && selectedTable.dataset && selectedTable.dataset.id) {
                tableId = parseInt(selectedTable.dataset.id);
            }
            
            // Now send transcription to order processing
            return fetch('/api/orders/process-transcription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transcription: transcriptionText,
                    table_id: tableId
                })
            });
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    console.error('Order Processing Error:', err);
                    throw new Error(err.detail || 'Network response was not ok');
                });
            }
            return response.json();
        })
        .then(orderData => {
            // Show processed order
            processedOrderContainer.classList.remove('hidden');
            processedOrderElement.textContent = orderData.processed_order || 'Could not process order';
            
            // Update recording status
            recordingStatus.textContent = 'Recording processed successfully';
            
            // Enable confirm button
            confirmOrderBtn.classList.remove('disabled');
            
            // Store order ID for submission
            confirmOrderBtn.dataset.orderId = orderData.order_id;
        })
        .catch(error => {
            console.error('Error processing audio:', error);
            recordingStatus.textContent = 'Error processing recording';
            transcriptionContainer.classList.remove('hidden');
            transcriptionElement.textContent = 'Error: Could not process audio. Please try again. Details: ' + error.message;
        });
    }

    // Submit voice order
    function submitVoiceOrder() {
        const orderId = confirmOrderBtn.dataset.orderId;
        
        if (!orderId || confirmOrderBtn.classList.contains('disabled')) {
            return;
        }
        
        // Update order status
        fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'pending'
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Close modal
            closeVoiceModal();
            
            // Refresh dashboard data
            loadDashboardData();
            
            // Show success notification
            showNotification('Order submitted successfully!');
        })
        .catch(error => {
            console.error('Error submitting order:', error);
            showNotification('Error submitting order. Please try again.', 'error');
        });
    }

    // Submit quick order
    function submitQuickOrder() {
        const tableId = quickTableSelect.value;
        const orderDetails = quickInput.value.trim();
        
        if (!tableId || !orderDetails) {
            showNotification('Please select a table and enter order details', 'error');
            return;
        }
        
        // Create order
        fetch('/api/orders/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                table_id: parseInt(tableId),
                details: `Table ${tableId}: ${orderDetails}`,
                raw_transcription: orderDetails
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Reset form
            quickInput.value = '';
            quickTableSelect.selectedIndex = 0;
            
            // Refresh dashboard data
            loadDashboardData();
            
            // Show success notification
            showNotification('Order submitted successfully!');
        })
        .catch(error => {
            console.error('Error submitting quick order:', error);
            showNotification('Error submitting order. Please try again.', 'error');
        });
    }

    // View order details
    function viewOrder(orderId) {
        window.location.href = `/orders/${orderId}`;
    }

    // Cancel order
    function cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }
        
        fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'cancelled'
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Refresh dashboard data
            loadDashboardData();
            
            // Show success notification
            showNotification('Order cancelled successfully!');
        })
        .catch(error => {
            console.error('Error cancelling order:', error);
            showNotification('Error cancelling order. Please try again.', 'error');
        });
    }

    // Show notification
    function showNotification(message, type = 'success') {
        // Create notification element if doesn't exist
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set type class
        notification.className = `notification notification-${type}`;
        
        // Set message
        notification.textContent = message;
        
        // Show notification
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // WebSocket connection for real-time updates
    function setupWebSocketConnection() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/kds`;
        
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            console.log('WebSocket connection established');
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // Handle different message types
            if (data.type === 'order_update') {
                // Refresh dashboard data
                loadDashboardData();
            }
        };
        
        socket.onclose = () => {
            console.log('WebSocket connection closed');
            // Try to reconnect after 5 seconds
            setTimeout(setupWebSocketConnection, 5000);
        };
        
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    // Initialize the application
    init();
});