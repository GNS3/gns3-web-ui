(function() {
  'use strict';

  // Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const wsUrl = params.get('ws_url');
  const password = params.get('password') || '';
  const nodeName = params.get('node_name') || 'SPICE';
  const autoconnect = params.get('autoconnect') !== '0';

  // DOM elements
  const spiceScreen = document.getElementById('spice-screen');
  const statusBar = document.getElementById('status-bar');
  const errorDialog = document.getElementById('error-dialog');
  const errorTitle = document.getElementById('error-title');
  const errorMessage = document.getElementById('error-message');
  const loadingIndicator = document.getElementById('loading');
  const canvasContainer = document.getElementById('spice-canvas-container');

  // State
  let sc = null;
  let connectionTimeout = null;

  // Logging utility
  function log(message, level = 'info') {
    const prefix = '[SPICE Console]';
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} ${prefix} ${level.toUpperCase()}: ${message}`;

    if (level === 'error') {
      console.error(logMessage);
    } else if (level === 'warn') {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  // Enhanced debugging for SPICE connection
  function debugSpiceState() {
    if (!sc) {
      log('SPICE connection object not initialized', 'warn');
      return;
    }

    log(`SPICE state: ${sc.state}`, 'info');
    log(`WebSocket readyState: ${sc.ws ? sc.ws.readyState : 'no WebSocket'}`, 'info');

    if (sc.ws) {
      log(`WebSocket url: ${sc.ws.url}`, 'info');
    }
  }

  // Update status display
  function updateStatus(message, type = 'info') {
    log(message, type);
    statusBar.textContent = message;
    statusBar.className = type;
    statusBar.style.opacity = '1';

    if (type === 'success') {
      setTimeout(() => {
        statusBar.style.opacity = '0';
      }, 3000);
    }
  }

  // Show error dialog
  function showError(title, message) {
    log(`${title}: ${message}`, 'error');
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorDialog.style.display = 'block';
    statusBar.style.display = 'none';

    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }

  // Hide loading indicator
  function hideLoading() {
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }

  // Validate required parameters
  if (!wsUrl) {
    showError('Missing Parameter', 'WebSocket URL (ws_url) is required. Please close this window and try opening the console again.');
    return;
  }

  // Set page title
  document.title = `SPICE Console - ${nodeName}`;
  log(`Opening SPICE console for node: ${nodeName}`);

  // Connection timeout handler
  if (autoconnect) {
    connectionTimeout = setTimeout(() => {
      debugSpiceState();

      // Note: spice-html5 uses 'ready' state, not 'connected'
      // Show error only if state is still connecting/start/link/ticket
      const connectingStates = ['connecting', 'start', 'link', 'ticket'];
      if (sc && connectingStates.includes(sc.state)) {
        log(`Connection timeout. Current state: ${sc.state}`, 'error');
        showError(
          'Connection Timeout',
          'Could not connect to the SPICE server. Please verify:\n\n' +
          '• The node is started\n' +
          '• The console type is set to SPICE\n' +
          '• Your network connection is stable\n' +
          '• No firewall is blocking the connection\n\n' +
          `Debug info: SPICE state = ${sc.state}`
        );
        if (sc) {
          sc.stop();
        }
      } else if (sc && sc.state === 'error') {
        log('SPICE connection in error state', 'error');
        showError(
          'Connection Error',
          'SPICE connection failed during initialization.\n\n' +
          'Please check the browser console for detailed error messages.'
        );
      } else {
        log(`Connection completed. State: ${sc.state}`, 'info');
      }
    }, 15000);
  }

  // Initialize SPICE
  try {
    log('Initializing SPICE connection...');
    log(`WebSocket URL: ${wsUrl.replace(/token=[^&]+/, 'token=***')}`);

    // Parse the WebSocket URL to extract host and port
    const url = new URL(wsUrl);
    const host = url.hostname;
    const port = url.port;
    const path = url.pathname + url.search;  // Include query params (token)

    // Reconstruct WebSocket URL (ws:// or wss://)
    const protocol = url.protocol === 'wss:' ? 'wss:' : 'ws:';
    const spiceWsUrl = `${protocol}//${host}:${port}${path}`;

    log(`SPICE WebSocket URL: ${spiceWsUrl.replace(/token=[^&]+/, 'token=***')}`);

    // Create SPICE main object
    sc = new SpiceMainConn({
      uri: spiceWsUrl,
      screen_id: 'spice-canvas-container',
      password: password,
      onsuccess: function() {
        log('onsuccess callback triggered', 'info');
        clearTimeout(connectionTimeout);
        hideLoading();
        updateStatus('Connected', 'success');
        log('Successfully connected to SPICE server');
        debugSpiceState();
      },
      onerror: function(e) {
        log(`onerror callback triggered: ${e}`, 'error');
        clearTimeout(connectionTimeout);
        hideLoading();
        const reason = e || 'Unknown error';
        log(`Connection error: ${reason}`, 'error');
        debugSpiceState();
        showError(
          'Connection Failed',
          `Could not connect to the SPICE server.\n\nReason: ${reason}\n\n` +
          'Please check if the node is still running and try again.'
        );
      },
      onagent: function() {
        log('SPICE agent connected');
      }
    });

    log('SPICE initialized successfully');
    log('Waiting for connection... (will check state in 15 seconds)');

    // Monitor state changes for debugging
    const stateCheckInterval = setInterval(() => {
      if (sc) {
        log(`Current SPICE state: ${sc.state}`, 'debug');
        if (sc.state === 'ready' || sc.state === 'error') {
          clearInterval(stateCheckInterval);
        }
      }
    }, 2000);

    log('SPICE initialized successfully');

  } catch (error) {
    clearTimeout(connectionTimeout);
    hideLoading();
    showError(
      'Initialization Error',
      `Failed to initialize SPICE console:\n\n${error.message}\n\n` +
      'Please ensure you are using a modern browser with WebSocket support.'
    );
    log(`Initialization error: ${error.message}`, 'error');
    log(error.stack, 'error');
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', (e) => {
    if (sc) {
      log('Page unloading, disconnecting SPICE...');
      sc.stop();
    }
  });

  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      log('Page hidden (SPICE connection paused)');
    } else {
      log('Page visible (SPICE connection active)');
    }
  });

})();
