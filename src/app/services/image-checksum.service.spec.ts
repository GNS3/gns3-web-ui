import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageChecksumService } from './image-checksum.service';

const mockWorker = () => ({ postMessage: vi.fn(), terminate: vi.fn(), onmessage: null, onerror: null });

describe('ImageChecksumService', () => {
  let workers: ReturnType<typeof mockWorker>[];

  beforeEach(() => {
    workers = [];
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          const worker = mockWorker();
          workers.push(worker);
          return worker;
        }
      }
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('hashes in a worker and terminates it when canceled', () => {
    const file = new File(['abc'], 'image.qcow2');
    const next = vi.fn();
    const subscription = new ImageChecksumService().calculate(file).subscribe(next);
    expect(workers[0].postMessage).toHaveBeenCalledWith(file);
    workers[0].onmessage({ data: { progress: 50 } });
    expect(next).toHaveBeenCalledWith({ progress: 50 });
    subscription.unsubscribe();
    expect(workers[0].terminate).toHaveBeenCalledOnce();
  });

  it('reuses a completed checksum on retry but never caches a canceled check', () => {
    const service = new ImageChecksumService();
    const file = new File(['abc'], 'image');
    service.calculate(file).subscribe();
    workers[0].onmessage({ data: { progress: 100, checksum: '900150983cd24fb0d6963f7d28e17f72' } });
    const next = vi.fn();
    service.calculate(file).subscribe(next);
    expect(workers).toHaveLength(1);
    expect(next).toHaveBeenCalledWith({ progress: 100, checksum: '900150983cd24fb0d6963f7d28e17f72' });
    const other = new File(['abc'], 'image');
    service.calculate(other).subscribe().unsubscribe();
    service.calculate(other).subscribe().unsubscribe();
    expect(workers).toHaveLength(3);
  });

  it('terminates after success and propagates worker errors', () => {
    const service = new ImageChecksumService();
    const complete = vi.fn();
    service.calculate(new File(['abc'], 'image')).subscribe({ complete });
    workers[0].onmessage({ data: { progress: 100, checksum: '900150983cd24fb0d6963f7d28e17f72' } });
    expect(complete).toHaveBeenCalledOnce();
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    const error = vi.fn();
    service.calculate(new File(['abc'], 'image')).subscribe({ error });
    workers[1].onerror();
    expect(error).toHaveBeenCalledOnce();
    expect(workers[1].terminate).toHaveBeenCalledOnce();
  });
});
