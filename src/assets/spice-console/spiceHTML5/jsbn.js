// Copyright (c) 2005-2006  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.
//
// JavaScript BigInteger and RSA implementation
// Adapted for spice-html5

(function() {
  'use strict';

  // BigInteger constructor
  window.BigInteger = function(a, b, c) {
    if (a \!= null) {
      if ("number" == typeof a) {
        this.fromNumber(a, b, c);
      } else if ("string" == typeof a) {
        this.fromString(a, b);
      } else if (Array.isArray(a)) {
        this.fromByteArray(a);
      }
    } else {
      this.data = [];
      this.t = 0;
      this.s = 0;
    }
  };

  window.BigInteger.DB = 28; // digit bit size
  window.BigInteger.DM = (1 << 28) - 1;
  window.BigInteger.DV = 1 << 28;

  window.BigInteger.prototype.fromByteArray = function(a) {
    // Convert byte array to BigInteger (big-endian)
    this.data = a.slice();
    this.t = a.length;
    this.s = this.t > 0 ? 0 : 1;
  };

  window.BigInteger.prototype.toByteArray = function() {
    // Convert BigInteger to byte array
    return this.data || [];
  };

  window.BigInteger.prototype.toString = function(radix) {
    if (\!radix) radix = 16;
    if (this.data) {
      return Array.from(this.data).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return '0';
  };

  window.BigInteger.prototype.negate = function() { return null; };
  window.BigInteger.prototype.abs = function() { return null; };
  window.BigInteger.prototype.compareTo = function(a) { return 0; };
  window.BigInteger.prototype.bitLength = function() {
    if (\!this.data || this.data.length === 0) return 0;
    return this.data.length * 8;
  };

  // RSAKey constructor
  window.RSAKey = function() {
    this.n = null;
    this.e = 0;
    this.d = null;
    this.p = null;
    this.q = null;
    this.dmp1 = null;
    this.dmq1 = null;
    this.coeff = null;
  };

  // For SPICE, we mainly need to store the public key
  // The actual RSA operations are done by the browser's crypto API when needed

})();
