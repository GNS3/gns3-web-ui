/**
 * Z-Index Debug Script for Session Menu and Confirm Dialog
 * Run this in browser console to check z-index values
 */

console.log('%c=== Menu & Dialog Z-Index Debug Started ===', 'font-size: 14px; font-weight: bold; color: #00ff00;');

// Monitor overlay container for menu and dialog
const overlayContainer = document.querySelector('.cdk-overlay-container');
if (!overlayContainer) {
  console.error('❌ Overlay container not found!');
} else {
  console.log('✅ Overlay container found, monitoring...');

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          const element = node;

          // Check for Session Menu
          if (element.classList && element.classList.contains('mat-menu-panel')) {
            setTimeout(function() {
              const overlayPane = element.closest('.cdk-overlay-pane');
              if (overlayPane) {
                const zIndex = window.getComputedStyle(overlayPane).zIndex;
                const inlineZ = overlayPane.style.zIndex;
                console.log(
                  '%c📋 Session Menu opened!',
                  'font-size: 12px; font-weight: bold; color: #ff9800;'
                );
                console.log('  Overlay Pane z-index:', {
                  inline: inlineZ || '(none)',
                  computed: zIndex
                });
              }
            }, 10);
          }

          // Check for Confirm Dialog
          if (element.classList && element.classList.contains('confirmation-dialog-panel')) {
            setTimeout(function() {
              const dialogPane = element;
              const zIndex = window.getComputedStyle(dialogPane).zIndex;
              const inlineZ = dialogPane.style.zIndex;
              console.log(
                '%c⚠️  Confirm Dialog opened!',
                'font-size: 12px; font-weight: bold; color: #f44336;'
              );
              console.log('  Dialog Pane z-index:', {
                inline: inlineZ || '(none)',
                computed: zIndex
              });
            }, 10);
          }
        }
      });
    });
  });

  observer.observe(overlayContainer, { childList: true, subtree: true });
}

// Manual check function
window.checkMenuZIndex = function() {
  console.clear();
  console.log('%c=== Current Menu & Dialog Z-Index ===', 'font-size: 14px; font-weight: bold;');

  // Check Session Menu
  const menuPane = document.querySelector('.cdk-overlay-pane .mat-menu-panel');
  if (menuPane) {
    const overlayPane = menuPane.closest('.cdk-overlay-pane');
    if (overlayPane) {
      const zIndex = window.getComputedStyle(overlayPane).zIndex;
      const inlineZ = overlayPane.style.zIndex;
      console.log('📋 Session Menu:');
      console.log('  Inline z-index:', inlineZ || '(none)');
      console.log('  Computed z-index:', zIndex);
    }
  } else {
    console.log('📋 Session Menu: (not opened)');
  }

  // Check Confirm Dialog
  const dialogPane = document.querySelector('.confirmation-dialog-panel');
  if (dialogPane) {
    const zIndex = window.getComputedStyle(dialogPane).zIndex;
    const inlineZ = dialogPane.style.zIndex;
    console.log('⚠️  Confirm Dialog:');
    console.log('  Inline z-index:', inlineZ || '(none)');
    console.log('  Computed z-index:', zIndex);
  } else {
    console.log('⚠️  Confirm Dialog: (not opened)');
  }

  // Check AI Chat for reference
  const aiChat = document.querySelector('app-ai-chat');
  if (aiChat) {
    const zIndex = window.getComputedStyle(aiChat).zIndex;
    const inlineZ = aiChat.style.zIndex;
    console.log('🤖 AI Chat (for reference):');
    console.log('  Inline z-index:', inlineZ || '(none)');
    console.log('  Computed z-index:', zIndex);
  }

  console.log('%c💡 Tip: Open the menu or dialog to see z-index values', 'font-size: 12px; color: #ffff00;');
};

console.log('%c✅ Script loaded. Commands:', 'font-size: 12px; color: #00aaff;');
console.log('  checkMenuZIndex() - Check current z-index values');
console.log('%c💡 Now open the session menu or confirm dialog to see z-index!', 'font-size: 12px; color: #ffff00;');
