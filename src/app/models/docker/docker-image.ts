export type DockerImagePullState = 'started' | 'downloading' | 'completed' | 'failed';

/**
 * Progress event pushed on the global notification stream while a compute
 * pulls a Docker image (`docker.image.pull`). `downloading` is throttled to
 * at most one event per second; `layers_*` and `message` only come with it.
 */
export interface DockerImagePullEvent {
  compute_id: string;
  progress_id: string;
  image: string;
  state: DockerImagePullState;
  layers_total?: number;
  layers_done?: number;
  message?: string;
}

export interface DockerImagePullNotification {
  action: 'docker.image.pull';
  event: DockerImagePullEvent;
}

/** Pushed on the global stream after an image was removed from a compute. */
export interface DockerImageDeletedNotification {
  action: 'docker.image.deleted';
  event: {
    compute_id: string;
    image: string;
  };
}

export class DockerImage {
  /** Full image reference, e.g. `ubuntu:latest` or `ios-xr/xrd-control-plane:24.4.1`. */
  image: string;
  /** Daemon image id (`sha256:...`). Absent when the compute predates 3.1. */
  id?: string;
  /** Image size in bytes. Absent when the compute predates 3.1. */
  size?: number;
  /** Created time as a unix timestamp (seconds). Absent when the compute predates 3.1. */
  created?: number | string;
}
