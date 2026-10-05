import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ImageChecksumProgress {
  progress: number;
  checksum?: string;
}

@Injectable({ providedIn: 'root' })
export class ImageChecksumService {
  private completed = new WeakMap<File, string>();
  calculate(file: File): Observable<ImageChecksumProgress> {
    const checksum = this.completed.get(file);
    if (checksum) return of({ progress: 100, checksum });
    return new Observable((subscriber) => {
      if (typeof Worker === 'undefined') {
        subscriber.error(new Error('This browser does not support background image checks.'));
        return;
      }
      const worker = new Worker(new URL('./image-checksum.worker', import.meta.url), { type: 'module' });
      // Register cleanup before posting in case structured cloning fails.
      subscriber.add(() => worker.terminate());
      worker.onmessage = ({ data }) => {
        if (data.error) {
          subscriber.error(new Error(data.error));
          return;
        }
        if (data.checksum) this.completed.set(file, data.checksum);
        subscriber.next(data);
        if (data.checksum) subscriber.complete();
      };
      worker.onerror = () => subscriber.error(new Error('The image checksum could not be calculated.'));
      worker.postMessage(file);
    });
  }
}
