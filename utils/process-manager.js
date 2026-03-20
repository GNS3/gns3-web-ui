/**
 * Process Manager Utility
 *
 * Manages external processes (Wireshark, tail, RDP, etc.)
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const platform = require('./platform');
const httpClient = require('./http-client');

// Maximum capture file size (100MB)
const MAX_CAPTURE_SIZE = 100 * 1024 * 1024;

/**
 * Stream capture data to Wireshark
 *
 * @param {string} streamUrl - URL of the capture stream
 * @param {string} authToken - Authentication token
 * @param {string} linkId - Link ID for temp file naming
 * @returns {Promise<{success: boolean}>}
 */
async function streamCaptureToWireshark(streamUrl, authToken, linkId) {
  const tempFile = platform.getTempCapturePath(linkId);
  console.log('[ProcessManager] Temporary capture file:', tempFile);

  const tailConfig = platform.getTailCommand(tempFile);
  const wiresharkConfig = platform.getWiresharkStreamCommand();

  console.log('[ProcessManager] Tail command:', tailConfig.command, tailConfig.args.join(' '));
  console.log('[ProcessManager] Wireshark command:', wiresharkConfig.command, wiresharkConfig.args.join(' '));

  // Create empty file first (avoid race condition with tail)
  fs.closeSync(fs.openSync(tempFile, 'w'));
  console.log('[ProcessManager] Created temporary file');

  // Spawn tail process to monitor the capture file
  const tail = spawn(tailConfig.command, tailConfig.args, {
    stdio: ['ignore', 'pipe', 'inherit']
  });

  // Spawn Wireshark to read from tail's stdout
  const wireshark = spawn(wiresharkConfig.command, wiresharkConfig.args, {
    stdio: ['pipe', 'ignore', 'inherit']
  });

  // Pipe tail output to Wireshark stdin
  tail.stdout.pipe(wireshark.stdin);

  return new Promise((resolve, reject) => {
    let fileStream = null;
    let isResolved = false;
    let bytesWritten = 0;

    const doResolve = (result) => {
      if (!isResolved) {
        isResolved = true;
        resolve(result);
      }
    };

    const doReject = (error) => {
      if (!isResolved) {
        isResolved = true;
        reject(error);
      }
    };

    const cleanup = () => {
      if (fileStream) {
        fileStream.destroy();
        fileStream = null;
      }
      tail.kill();
      // Don't kill Wireshark on normal exit, let user control it
      if (wireshark.pid && wireshark.exitCode === null) {
        wireshark.kill();
      }

      // Delay file deletion to give Wireshark time to finish reading
      setTimeout(() => {
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
            console.log('[ProcessManager] Temporary file deleted');
          }
        } catch (e) {
          console.warn('[ProcessManager] Failed to delete temporary file:', e.message);
        }
      }, 2000);
    };

    wireshark.on('error', (error) => {
      console.error('[ProcessManager] Failed to spawn Wireshark:', error);
      cleanup();
      doReject(new Error(`Failed to spawn Wireshark: ${error.message}`));
    });

    tail.on('error', (error) => {
      console.error('[ProcessManager] Failed to spawn tail:', error);
      cleanup();
      doReject(new Error(`Failed to spawn tail: ${error.message}`));
    });

    // Wait for both processes to spawn before starting download
    let tailSpawned = false;
    let wiresharkSpawned = false;

    const startDataDownload = () => {
      if (tailSpawned && wiresharkSpawned && !isResolved) {
        console.log('[ProcessManager] Both processes spawned, starting data download...');

        // Create write stream to temp file
        fileStream = fs.createWriteStream(tempFile);

        // Monitor file size to prevent disk space issues
        const onData = (chunk) => {
          bytesWritten += chunk.length;
          if (bytesWritten > MAX_CAPTURE_SIZE) {
            console.error('[ProcessManager] Capture size exceeded limit:', bytesWritten);
            cleanup();
            doReject(new Error(`Capture size exceeded limit (${MAX_CAPTURE_SIZE} bytes)`));
            return true; // Signal to abort stream
          }
          return false;
        };

        // Pipe the HTTP stream to the file with size monitoring
        httpClient.stream(streamUrl, authToken, fileStream, onData)
          .then(() => {
            console.log('[ProcessManager] Data streaming complete');
            doResolve({ success: true });
          })
          .catch((error) => {
            console.error('[ProcessManager] Error streaming capture:', error);
            cleanup();
            doReject(error);
          });
      }
    };

    tail.on('spawn', () => {
      console.log('[ProcessManager] Tail spawned');
      tailSpawned = true;
      startDataDownload();
    });

    wireshark.on('spawn', () => {
      console.log('[ProcessManager] Wireshark spawned');
      wiresharkSpawned = true;
      startDataDownload();
    });

    // Handle Wireshark exit (normal user action, not an error)
    wireshark.on('close', (code) => {
      console.log('[ProcessManager] Wireshark exited with code:', code);
      // Only cleanup on abnormal exit
      if (code !== 0 && code !== null) {
        cleanup();
      }
      // Don't resolve here - let the stream completion resolve the promise
    });

    tail.on('close', (code) => {
      console.log('[ProcessManager] Tail exited with code:', code);
    });
  });
}

/**
 * Execute a command and resolve when it completes
 *
 * @param {string} command - Command to execute
 * @returns {Promise<{success: boolean, error?: string}>}
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[ProcessManager] Command failed: ${error.message}`);
        reject(new Error(error.message));
      } else {
        console.log('[ProcessManager] Command executed successfully');
        resolve({ success: true });
      }
    });
  });
}

/**
 * Check if a software is installed
 *
 * @param {string} softwareName - Name of the software
 * @returns {Promise<{installed: boolean}>}
 */
function checkSoftwareInstalled(softwareName) {
  const { execSync } = require('child_process');

  try {
    if (softwareName === 'wireshark') {
      if (process.platform === 'win32') {
        execSync('where wireshark');
      } else {
        execSync('which wireshark');
      }
      return { installed: true };
    }
    return { installed: false };
  } catch (error) {
    return { installed: false };
  }
}

module.exports = {
  streamCaptureToWireshark,
  executeCommand,
  checkSoftwareInstalled
};
