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
      if (sc && sc.state !== 'connected') {
        showError(
          'Connection Timeout',
          'Could not connect to the SPICE server. Please verify:\n\n' +
          '• The node is started\n' +
          '• The console type is set to SPICE\n' +
          '• Your network connection is stable\n' +
          '• No firewall is blocking the connection'
        );
        if (sc) {
          sc.stop();
        }
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
        clearTimeout(connectionTimeout);
        hideLoading();
        updateStatus('Connected', 'success');
        log('Successfully connected to SPICE server');
      },
      onerror: function(e) {
        clearTimeout(connectionTimeout);
        hideLoading();
        const reason = e || 'Unknown error';
        log(`Connection error: ${reason}`, 'error');
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
