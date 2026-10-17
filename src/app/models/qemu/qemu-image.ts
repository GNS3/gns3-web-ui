import type { Image } from '../images';

export class QemuImage {
  filename: string;
  filesize: number;
  md5sum: string;
  path: string;
}

/** Use the server's canonical reference; retain absolute paths for older servers. */
export function qemuImagePath(image: { reference?: string; path?: string; filename: string }): string {
  return (image.reference || image.path || image.filename).replace(/\\/g, '/');
}

/** Missing inventory rows are retained for diagnostics, but cannot be selected. */
export function isAvailableIsoImage(
  image: Pick<Image, 'filename' | 'availability'> & Partial<Pick<Image, 'image_type'>>
): boolean {
  return (
    !!image.filename?.toLowerCase().endsWith('.iso') &&
    (!image.image_type || image.image_type === 'qemu') &&
    (!image.availability || image.availability === 'unknown' || image.availability === 'available')
  );
}
