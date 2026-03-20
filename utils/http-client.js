/**
 * HTTP Client Utility
 *
 * Provides authenticated HTTP request methods for GNS3 API
 */

const http = require('http');
const https = require('https');

/**
 * Make an authenticated HTTP request to GNS3 API
 *
 * @param {string} url - Full URL
 * @param {string} authToken - Bearer token
 * @param {string} method - HTTP method
 * @param {object} body - Request body (optional)
 * @returns {Promise<{statusCode: number, data: string}>}
 */
function request(url, authToken, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data: data }));
    });

    req.on('error', reject);

    if (body) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Make a GET request
 */
function get(url, authToken) {
  return request(url, authToken, 'GET');
}

/**
 * Make a POST request
 */
function post(url, authToken, body) {
  return request(url, authToken, 'POST', body);
}

/**
 * Stream a GET request to a writable stream
 *
 * @param {string} url - Full URL
 * @param {string} authToken - Bearer token
 * @param {object} writableStream - Writable stream
 * @param {function} onData - Optional callback for each data chunk
 * @returns {Promise}
 */
function stream(url, authToken, writableStream, onData = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };

    const req = client.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      // If onData callback provided, use it to monitor data
      if (onData) {
        res.on('data', (chunk) => {
          const shouldAbort = onData(chunk);
          if (shouldAbort) {
            res.destroy();
          }
        });
      }

      res.pipe(writableStream);

      res.on('end', () => resolve());
      res.on('error', (err) => reject(err));
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('HTTP request timeout'));
    });
    req.end();
  });
}

module.exports = {
  request,
  get,
  post,
  stream
};
