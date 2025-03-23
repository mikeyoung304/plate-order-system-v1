document.addEventListener('DOMContentLoaded', function() {
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
        
        // Here you would integrate with Whisper API
        console.log('Recording started...');
    };
    
    // Function to handle recording stop
    const stopRecording = () => {
        recordBtn.classList.remove('recording');
        recordBtn.innerHTML = '<i class="fas fa-microphone record-icon"></i> Press and hold to record order';
        recordStatus.innerText = 'Processing...';
        
        // Here you would send the audio to Whisper API
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