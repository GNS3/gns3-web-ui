import { Image } from '@models/images';

export type ImageUploadStatus = 'queued' | 'uploading' | 'uploaded' | 'error' | 'canceled';

export interface ImageTableRow extends Partial<Image> {
  rowType: 'image' | 'upload';
  tempId?: string;
  uploadProgress?: number;
  uploadStatus?: ImageUploadStatus;
  errorMessage?: string;
}
