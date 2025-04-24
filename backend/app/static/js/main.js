// Initialize service worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/js/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Initialize all features when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load all necessary scripts
    const scripts = [
        '/static/js/ipad-voice-recognition.js',
        '/static/js/ipad-stability-tester.js',
        '/static/js/ipad-optimizations.js',
        '/static/js/ux-optimization.js',
        '/static/js/enhanced-front-of-house.js'
    ];

    // Function to load scripts sequentially
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Load all scripts
    Promise.all(scripts.map(loadScript))
        .then(() => {
            console.log('All scripts loaded successfully');
            // Initialize features after scripts are loaded
            if (window.initializeVoiceRecognition) initializeVoiceRecognition();
            if (window.initializeStabilityTester) initializeStabilityTester();
            if (window.initializeOptimizations) initializeOptimizations();
            if (window.initializeUX) initializeUX();
            if (window.initializeFrontOfHouse) initializeFrontOfHouse();
        })
        .catch(error => {
            console.error('Error loading scripts:', error);
        });
}); 