// Random Number Generator for JavaScript RSA
// Minimal implementation for spice-html5

(function() {
  'use strict';

  // Simple random number generator
  function rng_get_byte() {
    if (window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(1);
      window.crypto.getRandomValues(bytes);
      return bytes[0];
    }
    // Fallback to Math.random()
    return Math.floor(Math.random() * 256);
  }

  // Expose globally
  window.rng_get_byte = rng_get_byte;
})();
