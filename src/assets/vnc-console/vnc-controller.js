(function() {
  'use strict';

  // Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const wsUrl = params.get('ws_url');
  const nodeName = params.get('node_name') || 'VNC';
  const autoconnect = params.get('autoconnect') !== '0';

  // DOM elements
  const container = document.getElementById('vnc-container');
  const statusBar = document.getElementById('status-bar');
  const errorDialog = document.getElementById('error-dialog');
  const errorTitle = document.getElementById('error-title');
  const errorMessage = document.getElementById('error-message');
  const loadingIndicator = document.getElementById('loading');

  // State
  let rfb = null;
  let connectionTimeout = null;

  // Logging utility
  function log(message, level = 'info') {
    const prefix = '[VNC Console]';
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

    // Auto-hide success messages after 3 seconds
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
  document.title = `VNC Console - ${nodeName}`;
  log(`Opening VNC console for node: ${nodeName}`);

  // Connection timeout handler
  if (autoconnect) {
    connectionTimeout = setTimeout(() => {
      if (rfb && rfb._rfb_connection_state !== 'connected') {
        showError(
          'Connection Timeout',
          'Could not connect to the VNC server. Please verify:\n\n' +
          '• The node is started\n' +
          '• The console type is set to VNC\n' +
          '• Your network connection is stable\n' +
          '• No firewall is blocking the connection'
        );
        if (rfb) {
          rfb.disconnect();
        }
      }
    }, 15000); // 15 second timeout
  }

  // Initialize noVNC
  try {
    log('Initializing noVNC RFB connection...');
    log(`WebSocket URL: ${wsUrl.replace(/ticket=[^&]+/, 'ticket=***')}`); // Hide token in logs

    // Create RFB instance
    rfb = new RFB(container, wsUrl, {
      resizeSession: true,
      // Additional noVNC options can be added here
    });

    // Event: Connecting
    rfb.addEventListener('connecting', () => {
      log('Connecting to VNC server...');
      updateStatus('Connecting...');
    });

    // Event: Connected
    rfb.addEventListener('connect', () => {
      clearTimeout(connectionTimeout);
      hideLoading();
      updateStatus('Connected', 'success');
      log('Successfully connected to VNC server');
    });

    // Event: Disconnect
    rfb.addEventListener('disconnect', (e) => {
      clearTimeout(connectionTimeout);
      hideLoading();

      const clean = e.detail && e.detail.clean;

      if (clean) {
        // Normal disconnect
        log('Disconnected from VNC server (clean)');
        updateStatus('Disconnected', 'warning');
      } else {
        // Abnormal disconnect
        const reason = e.detail ? e.detail.reason : 'Unknown error';
        log(`Connection lost: ${reason}`, 'error');
        showError(
          'Connection Lost',
          `The VNC connection was closed unexpectedly.\n\nReason: ${reason}\n\n` +
          'Please check if the node is still running and try again.'
        );
      }
    });

    // Event: Credentials required
    rfb.addEventListener('credentialsrequired', () => {
      log('VNC server requires authentication');
      const password = prompt('Enter VNC password:');

      if (password) {
        log('Sending VNC credentials');
        rfb.sendCredentials({ password: password });
      } else {
        showError(
          'Authentication Required',
          'This VNC server requires a password. Please close this window and try again with the correct credentials.'
        );
        rfb.disconnect();
      }
    });

    // Event: Security failure
    rfb.addEventListener('securityfailure', () => {
      clearTimeout(connectionTimeout);
      log('Security negotiation failed', 'error');
      showError(
        'Security Error',
        'Security negotiation with the VNC server failed. This could be due to:\n\n' +
        '• Unsupported security type\n' +
        '• TLS/SSL configuration mismatch\n' +
        '• Protocol version incompatibility\n\n' +
        'Please check the server configuration and try again.'
      );
    });

    // Event: Clipboard
    rfb.addEventListener('clipboard', (e) => {
      if (e.detail && e.detail.text) {
        log('Clipboard data received from server');
        // Clipboard handling could be added here if needed
      }
    });

    // Focus management
    container.addEventListener('click', () => {
      if (rfb) {
        rfb.focus();
        log('VNC canvas focused');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+Alt+Del
      if (e.ctrlKey && e.altKey && e.key === 'Delete') {
        e.preventDefault();
        if (rfb) {
          log('Sending Ctrl+Alt+Del');
          rfb.sendCtrlAltDel();
        }
      }

      // Ctrl+Alt+Backspace
      if (e.ctrlKey && e.altKey && e.key === 'Backspace') {
        e.preventDefault();
        log('Sending Ctrl+Alt+Backspace');
        // noVNC doesn't have a direct method for this, need to send key events
        if (rfb) {
          rfb.sendKey(
            0xFF,  // Delete
            'ControlLeft',
            ['ControlLeft', 'AltLeft']
          );
        }
      }

      // Tab handling for browser shortcuts
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        log('Ctrl+Shift+Tab pressed (allowing browser default)');
      }

      // F5 and F11 - allow browser defaults for refresh and fullscreen
      if (e.key === 'F5' || e.key === 'F11') {
        log(`Function key ${e.key} pressed (allowing browser default)`);
        return;
      }

      // Prevent some browser shortcuts that interfere with VNC
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault(); // Prevent save
        log('Prevented Ctrl+S (save)');
      }

      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault(); // Prevent print
        log('Prevented Ctrl+P (print)');
      }
    });

    // Window resize handling
    window.addEventListener('resize', () => {
      if (rfb && rfb._rfb_connection_state === 'connected') {
        // noVNC will handle resize automatically with resizeSession option
        log('Window resized');
      }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', (e) => {
      if (rfb) {
        log('Page unloading, disconnecting VNC...');
        rfb.disconnect();
      }
    });

    // Handle visibility change (pause/resume)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        log('Page hidden (VNC connection paused)');
      } else {
        log('Page visible (VNC connection active)');
        if (rfb) {
          rfb.focus();
        }
      }
    });

    log('noVNC RFB initialized successfully');

  } catch (error) {
    clearTimeout(connectionTimeout);
    hideLoading();
    showError(
      'Initialization Error',
      `Failed to initialize VNC console:\n\n${error.message}\n\n` +
      'Please ensure you are using a modern browser with WebSocket support.'
    );
    log(`Initialization error: ${error.message}`, 'error');
    log(error.stack, 'error');
  }

})();
