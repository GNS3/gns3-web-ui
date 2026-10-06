export class Image {
  filename: string;
  path: string;
  image_type: string;
  image_size: number;
  checksum: string;
  checksum_algorithm: string;
  created_at: string;
  updated_at: string;
  availability?: 'unknown' | 'available' | 'missing' | 'unavailable' | 'invalid';
  last_seen_at?: string;
  last_verified_at?: string;
  last_error?: string;
}

export interface ImageSyncJob {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled' | 'interrupted';
  dry_run: boolean;
  force_checksum: boolean;
  counts: Record<string, number>;
  errors: { path: string; reason: string }[];
}

export class ImageData {}

export interface ImageTemplateResult {
  status: 'created' | 'skipped';
  name?: string;
  reason?: string;
  template_id?: string;
}

export interface ImageApplianceMatch {
  name: string;
  version: string;
  missing_images: string[];
  downloadable_images: string[];
}

export interface ImageCompatibility {
  checksum: string;
  matches: ImageApplianceMatch[];
}

export interface ImageCompatibilityCatalog {
  image_sizes: number[];
  has_unknown_sizes: boolean;
}
