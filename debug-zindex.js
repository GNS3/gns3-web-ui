/**
 * Z-Index Debug Script (Enhanced)
 * Run this in browser console to debug z-index issues
 * Now includes Session Menu and Confirm Dialog tracking
 */

console.log('%c=== Z-Index Debug Script Started ===', 'font-size: 16px; font-weight: bold; color: #00ff00;');

// Track elements
const trackedElements = {
  aiChat: null,
  webConsole: null,
  sessionMenu: null,
  confirmDialog: null
};

// Find elements
function findElements() {
  trackedElements.aiChat = document.querySelector('app-ai-chat'); // Fixed: select app-ai-chat instead
  trackedElements.webConsole = document.querySelector('.console-wrapper, app-console-wrapper');
  trackedElements.sessionMenu = document.querySelector('.mat-menu-panel.session-action-menu');
  trackedElements.confirmDialog = document.querySelector('.confirmation-dialog-panel');

  console.log('📊 Elements found:');
  console.log('  AI Chat:', trackedElements.aiChat ? '✓' : '✗');
  console.log('  Web Console:', trackedElements.webConsole ? '✓' : '✗');
  console.log('  Session Menu:', trackedElements.sessionMenu ? '✓' : '○ (not opened yet)');
  console.log('  Confirm Dialog:', trackedElements.confirmDialog ? '✓' : '○ (not opened yet)');
}

// Get z-index info
function getZIndexInfo(element) {
  if (!element) return null;

  const styles = window.getComputedStyle(element);
  const inlineZ = element.style.zIndex;
  const computedZ = styles.zIndex;

  return {
    element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
    inlineZIndex: inlineZ || '(none)',
    computedZIndex: computedZ,
    display: styles.display,
    position: styles.position
  };
}

// Log current state
function logCurrentState() {
  console.log('%c📊 Current Z-Index State:', 'font-size: 14px; font-weight: bold; color: #00aaff;');

  if (trackedElements.aiChat) {
    const aiInfo = getZIndexInfo(trackedElements.aiChat);
    console.log('  AI Chat:', aiInfo);
  }

  if (trackedElements.webConsole) {
    const consoleInfo = getZIndexInfo(trackedElements.webConsole);
    console.log('  Web Console:', consoleInfo);
  }

  if (trackedElements.sessionMenu) {
    const menuInfo = getZIndexInfo(trackedElements.sessionMenu);
    console.log('  %c📋 Session Menu:', 'color: #ff9800;', menuInfo);
  }

  if (trackedElements.confirmDialog) {
    const dialogInfo = getZIndexInfo(trackedElements.confirmDialog);
    console.log('  %c⚠️  Confirm Dialog:', 'color: #f44336;', dialogInfo);
  }
}

// Monitor click events
function monitorClicks() {
  document.addEventListener('click', (e) => {
    setTimeout(() => {
      const target = e.target;
      const inAiChat = target.closest('app-ai-chat'); // Fixed: use app-ai-chat selector
      const inConsole = target.closest('.console-wrapper, app-console-wrapper');
      const inSessionMenu = target.closest('.mat-menu-panel.session-action-menu');
      const inConfirmDialog = target.closest('.confirmation-dialog-panel');

      if (inSessionMenu) {
        console.log('%c🖱️ Click detected in Session Menu', 'font-size: 12px; color: #ff9800;');
        logCurrentState();
      } else if (inConfirmDialog) {
        console.log('%c🖱️ Click detected in Confirm Dialog', 'font-size: 12px; color: #f44336;');
        logCurrentState();
      } else if (inAiChat) {
        console.log('%c🖱️ Click detected in AI Chat', 'font-size: 12px; color: #4caf50;');
        logCurrentState();
      } else if (inConsole) {
        console.log('%c🖱️ Click detected in Web Console', 'font-size: 12px; color: #2196f3;');
        logCurrentState();
      }
    }, 100);
  }, true);
}

// Monitor z-index changes
function monitorZIndexChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target;
        const zIndex = target.style.zIndex || '(none)';

        // Identify element type
        if (target === trackedElements.aiChat) {
          console.log('%c🔄 AI Chat z-index changed:', 'font-size: 12px; color: #4caf50;', zIndex);
        } else if (target === trackedElements.webConsole) {
          console.log('%c🔄 Web Console z-index changed:', 'font-size: 12px; color: #2196f3;', zIndex);
        } else if (target.classList.contains('session-action-menu')) {
          console.log('%c🔄 Session Menu z-index changed:', 'font-size: 12px; color: #ff9800;', zIndex);
        } else if (target.classList.contains('confirmation-dialog-panel')) {
          console.log('%c🔄 Confirm Dialog z-index changed:', 'font-size: 12px; color: #f44336;', zIndex);
        }
      }
    });
  });

  // Observe all elements
  if (trackedElements.aiChat) {
    observer.observe(trackedElements.aiChat, { attributes: true, attributeFilter: ['style'] });
  }
  if (trackedElements.webConsole) {
    observer.observe(trackedElements.webConsole, { attributes: true, attributeFilter: ['style'] });
  }
}

// Monitor overlay container for dynamic elements (menus, dialogs)
function monitorOverlayContainer() {
  const overlayContainer = document.querySelector('.cdk-overlay-container');
  if (!overlayContainer) {
    console.log('⚠️  Overlay container not found yet');
    return;
  }

  const overlayObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          const element = node;

          // Check for Session Menu
          if (element.classList?.contains('session-action-menu')) {
            console.log('%c✨ Session Menu opened!', 'font-size: 14px; font-weight: bold; color: #ff9800;');
            trackedElements.sessionMenu = element;
            logCurrentState();

            // Start observing this menu
            new MutationObserver((changes) => {
              changes.forEach((change) => {
                if (change.type === 'attributes' && change.attributeName === 'style') {
                  console.log('%c🔄 Session Menu z-index:', 'font-size: 12px; color: #ff9800;',
                    element.style.zIndex || '(none)');
                }
              });
            }).observe(element, { attributes: true, attributeFilter: ['style'] });
          }

          // Check for Confirm Dialog
          if (element.classList?.contains('confirmation-dialog-panel')) {
            console.log('%c⚠️  Confirm Dialog opened!', 'font-size: 14px; font-weight: bold; color: #f44336;');
            trackedElements.confirmDialog = element;
            logCurrentState();

            // Start observing this dialog
            new MutationObserver((changes) => {
              changes.forEach((change) => {
                if (change.type === 'attributes' && change.attributeName === 'style') {
                  console.log('%c🔄 Confirm Dialog z-index:', 'font-size: 12px; color: #f44336;',
                    element.style.zIndex || '(none)');
                }
              });
            }).observe(element, { attributes: true, attributeFilter: ['style'] });
          }
        }
      });

      // Check for removed elements
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.classList?.contains('session-action-menu')) {
            console.log('%c❌ Session Menu closed', 'font-size: 12px; color: #ff9800;');
            trackedElements.sessionMenu = null;
            logCurrentState();
          }
          if (node.classList?.contains('confirmation-dialog-panel')) {
            console.log('%c❌ Confirm Dialog closed', 'font-size: 12px; color: #f44336;');
            trackedElements.confirmDialog = null;
            logCurrentState();
          }
        }
      });
    });
  });

  overlayObserver.observe(overlayContainer, { childList: true, subtree: true });
  console.log('✅ Overlay container monitoring active');
}

// Initialize
findElements();
logCurrentState();
monitorClicks();
monitorZIndexChanges();
monitorOverlayContainer();

console.log('%c✅ Debug script active. Now tracking Session Menu and Confirm Dialog!', 'font-size: 12px; color: #00ff00;');

// Enhanced manual check function
window.checkZIndex = function() {
  console.clear();
  console.log('%c=== Complete Z-Index Check ===', 'font-size: 16px; font-weight: bold;');

  // Refresh elements - also search inside app-ai-chat
  findElements();

  // If AI Chat not found directly, try alternative selector
  if (!trackedElements.aiChat) {
    const aiChatApp = document.querySelector('app-ai-chat');
    if (aiChatApp) {
      trackedElements.aiChat = aiChatApp;
    }
  }

  const results = [];

  if (trackedElements.aiChat) {
    const aiInfo = getZIndexInfo(trackedElements.aiChat);
    results.push({ Element: 'AI Chat', ...aiInfo });
  }

  if (trackedElements.webConsole) {
    const consoleInfo = getZIndexInfo(trackedElements.webConsole);
    results.push({ Element: 'Web Console', ...consoleInfo });
  }

  if (trackedElements.sessionMenu) {
    const menuInfo = getZIndexInfo(trackedElements.sessionMenu);
    results.push({ Element: '📋 Session Menu', ...menuInfo });
  }

  if (trackedElements.confirmDialog) {
    const dialogInfo = getZIndexInfo(trackedElements.confirmDialog);
    results.push({ Element: '⚠️  Confirm Dialog', ...dialogInfo });
  }

  console.table(results);

  return trackedElements;
};

// Quick test function - opens session menu
window.testSessionMenu = function() {
  const menuButton = document.querySelector('.session-menu-button');
  if (menuButton) {
    menuButton.click();
    console.log('📋 Session menu button clicked');
  } else {
    console.error('❌ Session menu button not found - is AI Chat open?');
  }
};

console.log('%c💡 Available commands:', 'font-size: 12px; color: #ffff00;');
console.log('  checkZIndex() - Show current z-index state');
console.log('  testSessionMenu() - Click the session menu button');
