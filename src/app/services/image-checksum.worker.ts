import * as SparkMD5 from 'spark-md5';

// Runs outside the UI thread and retains only one 4 MiB slice in memory.
self.onmessage = async ({ data: file }: MessageEvent<File>) => {
  const hash = new SparkMD5.ArrayBuffer();
  try {
    const chunkSize = 4 * 1024 * 1024;
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      hash.append(await file.slice(offset, offset + chunkSize).arrayBuffer());
      self.postMessage({ progress: Math.round((Math.min(offset + chunkSize, file.size) / file.size) * 100) });
    }
    self.postMessage({ progress: 100, checksum: hash.end() });
  } catch {
    self.postMessage({ error: 'The selected file could not be read.' });
  } finally {
    hash.destroy();
  }
};
