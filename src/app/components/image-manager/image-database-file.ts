import { Image } from '@models/images';

export type ImageUploadStatus = 'queued' | 'uploading' | 'uploaded' | 'error' | 'canceled';

export interface ImageTableRow extends Partial<Image> {
  /**
   * `image` - file in the image catalog; `upload` - background upload in flight;
   * `docker` - image present in the local Docker daemon (not a file on disk).
   */
  rowType: 'image' | 'upload' | 'docker';
  tempId?: string;
  uploadProgress?: number;
  uploadStatus?: ImageUploadStatus;
  errorMessage?: string;
  /** Original reference for docker rows (`filename` mirrors it for display/sorting). */
  dockerImage?: string;
  /** Daemon image id for docker rows, when the compute reports it (3.1+). */
  dockerId?: string;
}
