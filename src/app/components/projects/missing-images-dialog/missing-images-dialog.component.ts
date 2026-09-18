import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Controller } from '@models/controller';
import { Image } from '@models/images';
import { DockerImage } from '@models/docker/docker-image';
import { MissingImage, Node } from '../../../cartography/models/node';
import { NodesDataSource } from '../../../cartography/datasources/nodes-datasource';
import { DockerService } from '@services/docker.service';
import { ImageManagerService } from '@services/image-manager.service';
import { NodeService } from '@services/node.service';
import { ToasterService } from '@services/toaster.service';

export interface MissingImagesDialogData {
  controller: Controller;
  nodes: Node[];
  /**
   * Header title. Defaults to "Project missing images"; the context menu
   * passes "Node missing image" since only one node is being fixed.
   */
  title?: string;
  /**
   * Intro paragraph. Defaults to the project-wide wording; the context menu
   * passes a node-specific wording.
   */
  introText?: string;
  /**
   * Label of the button that dismisses the dialog without applying changes.
   * Defaults to "Open project without fixing"; the context menu passes
   * "Cancel" since the project is already open.
   */
  dismissButtonText?: string;
}

export interface MissingImagesDialogResult {
  updated: number;
  remaining: number;
}

export interface MissingImageRow {
  key: string;
  property: string;
  propertyLabel: string;
  image: string;
  isDocker: boolean;
  options: string[];
}

export interface MissingImagesNodeGroup {
  node: Node;
  rows: MissingImageRow[];
}

/**
 * Maps a node image property to a human readable label.
 */
const IMAGE_PROPERTY_LABELS: Record<string, string> = {
  hda_disk_image: 'Hard disk (HDA)',
  hdb_disk_image: 'Hard disk (HDB)',
  hdc_disk_image: 'Hard disk (HDC)',
  hdd_disk_image: 'Hard disk (HDD)',
  cdrom_image: 'CD-ROM',
  initrd: 'Initrd',
  kernel_image: 'Kernel',
  bios_image: 'BIOS',
  image: 'Image',
  path: 'Image',
};

/**
 * Maps a node type to the image type registered in the image manager.
 */
const NODE_IMAGE_TYPES: Record<string, string> = {
  qemu: 'qemu',
  dynamips: 'ios',
  iou: 'iou',
  docker: 'docker',
};

/**
 * Invites the user to replace the missing images of a project with compatible
 * images already available in the image manager. When no compatible image is
 * available the affected node stays in its degraded state (it cannot start).
 */
@Component({
  selector: 'app-missing-images-dialog',
  standalone: true,
  templateUrl: './missing-images-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
  ],
})
export class MissingImagesDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<MissingImagesDialogComponent>);
  readonly data = inject<MissingImagesDialogData>(MAT_DIALOG_DATA);
  private imageManagerService = inject(ImageManagerService);
  private dockerService = inject(DockerService);
  private nodeService = inject(NodeService);
  private nodesDataSource = inject(NodesDataSource);
  private toasterService = inject(ToasterService);

  readonly loading = signal(true);
  readonly applying = signal(false);
  readonly groups = signal<MissingImagesNodeGroup[]>([]);
  readonly selections = signal<Record<string, string | undefined>>({});
  // Per-row filtered Docker image suggestions (autocomplete).
  readonly dockerFiltered = signal<Record<string, string[]>>({});

  get dismissButtonText(): string {
    return this.data.dismissButtonText || 'Open project without fixing';
  }

  get title(): string {
    return this.data.title || 'Project missing images';
  }

  get introText(): string {
    return (
      this.data.introText ||
      'This project references images that are not available. Select a compatible replacement for each entry below: ' +
        'emulator images come from the image manager, while Docker images can be picked from the compute or typed in to ' +
        'be pulled from a registry. Nodes without a compatible image are kept in a degraded state and cannot be started.'
    );
  }

  private images: Image[] = [];
  private dockerImagesByCompute = new Map<string, DockerImage[]>();

  ngOnInit(): void {
    this.loadImages();
  }

  /**
   * Load emulator and Docker replacement lists in parallel. Docker images are
   * kept per compute so a node is never offered an image that only exists on a
   * different compute.
   */
  private loadImages(): void {
    const needsEmulatorImages = this.data.nodes.some((node) =>
      (node.missing_images || []).some(
        (missing) => (missing.image_type || this.imageTypeForNode(node.node_type)) !== 'docker'
      )
    );
    const computeIds = new Set<string>();
    for (const node of this.data.nodes) {
      const hasMissingDockerImage = (node.missing_images || []).some(
        (missing) => (missing.image_type || this.imageTypeForNode(node.node_type)) === 'docker'
      );
      if (hasMissingDockerImage && node.compute_id) {
        computeIds.add(node.compute_id);
      }
    }

    const emulatorImagesRequest = needsEmulatorImages
      ? this.imageManagerService.getImages(this.data.controller).pipe(catchError(() => of([] as Image[])))
      : of([] as Image[]);
    const dockerRequests = [...computeIds].map((computeId) =>
      this.dockerService.getImagesForCompute(this.data.controller, computeId).pipe(
        map((images) => ({ computeId, images: images || [] })),
        catchError(() => of({ computeId, images: [] as DockerImage[] }))
      )
    );
    const dockerImagesRequest = dockerRequests.length ? forkJoin(dockerRequests) : of([]);

    forkJoin({ emulatorImages: emulatorImagesRequest, dockerImages: dockerImagesRequest }).subscribe((result) => {
      this.images = result.emulatorImages;
      this.dockerImagesByCompute.clear();
      for (const entry of result.dockerImages) {
        this.dockerImagesByCompute.set(entry.computeId, entry.images.filter((image) => !!image?.image));
      }
      this.buildGroups();
    });
  }

  private imageTypeForNode(nodeType: string): string {
    return NODE_IMAGE_TYPES[nodeType] || nodeType;
  }

  private buildGroups(): void {
    const groups: MissingImagesNodeGroup[] = [];
    const dockerFiltered: Record<string, string[]> = {};

    for (const node of this.data.nodes) {
      const missingImages = (node.missing_images || []).filter((missing) => !!missing.image);
      if (missingImages.length === 0) {
        continue;
      }

      const rows: MissingImageRow[] = missingImages.map((missing: MissingImage, index: number) => {
        const property = missing.property || 'image';
        const imageType = missing.image_type || this.imageTypeForNode(node.node_type);
        const key = `${node.node_id}::${property}::${index}`;
        const isDocker = imageType === 'docker';
        const options = this.optionsForType(imageType, node.compute_id);
        if (isDocker) {
          dockerFiltered[key] = options;
        }
        return {
          key,
          property,
          propertyLabel: IMAGE_PROPERTY_LABELS[property] || property,
          image: missing.image,
          isDocker,
          options,
        };
      });

      groups.push({
        node,
        rows,
      });
    }

    this.groups.set(groups);
    this.selections.set({});
    this.dockerFiltered.set(dockerFiltered);
    this.loading.set(false);
  }

  private optionsForType(imageType: string, computeId?: string): string[] {
    if (imageType === 'docker') {
      return [...new Set((this.dockerImagesByCompute.get(computeId || '') || []).map((image) => image.image))].sort();
    }
    return [
      ...new Set(
        this.images
          .filter((image) => image.image_type === imageType)
          // Node properties contain portable image references. The database
          // path is controller-local and can be invalid on a remote compute.
          .map((image) => image.filename)
          .filter(Boolean)
      ),
    ].sort();
  }

  onSelectionChange(key: string, value: string | undefined): void {
    this.selections.update((current) => ({ ...current, [key]: value }));
  }

  /**
   * Free-text input for a Docker image reference. The user can either pick a
   * local image from the autocomplete or type any registry reference (the
   * server pulls it from the registry when the node is created).
   */
  onDockerInput(key: string, value: string): void {
    this.selections.update((current) => ({ ...current, [key]: value }));

    const row = this.groups()
      .reduce<MissingImageRow[]>((rows, group) => rows.concat(group.rows), [])
      .find((candidate) => candidate.key === key);
    const allOptions = row?.options || [];
    const query = (value || '').trim().toLowerCase();
    const filtered = query ? allOptions.filter((option) => option.toLowerCase().includes(query)) : allOptions;
    this.dockerFiltered.update((current) => ({ ...current, [key]: filtered }));
  }

  /**
   * True when at least one missing image has a selection different from the
   * missing file. Used to enable the apply button.
   */
  hasChanges(): boolean {
    const selections = this.selections();
    return this.groups().some((group) =>
      group.rows.some((row) => {
        const value = selections[row.key];
        return !!value && value !== row.image;
      })
    );
  }

  /**
   * Apply the selected replacements. Each node is updated once with all its
   * changed image properties so the server can (re)create it on its compute.
   */
  applyChanges(): void {
    const selections = this.selections();
    const updates: Observable<{ node?: Node; success: boolean; remaining: number }>[] = [];
    let remaining = 0;

    for (const group of this.groups()) {
      const properties: Record<string, unknown> = { ...(group.node.properties as any) };
      let changed = false;
      let unresolved = 0;
      for (const row of group.rows) {
        const value = selections[row.key]?.trim();
        if (value && value !== row.image) {
          properties[row.property] = value;
          changed = true;
        } else {
          // still missing (no replacement selected or no compatible image)
          unresolved += 1;
        }
      }
      if (changed) {
        const nodeToUpdate: Node = { ...group.node, properties: properties as any };
        updates.push(
          this.nodeService.updateNode(this.data.controller, nodeToUpdate).pipe(
            map((node) => ({
              node,
              success: true,
              remaining: node?.missing_image ? node.missing_images?.length || 1 : 0,
            })),
            catchError((error) => {
              const message = error?.error?.message || error?.message || 'Failed to update node image';
              this.toasterService.error(message);
              // The request failed, so every image originally missing from
              // this node remains unresolved.
              return of({ node: undefined, success: false, remaining: group.rows.length });
            })
          )
        );
      } else {
        remaining += unresolved;
      }
    }

    if (updates.length === 0) {
      this.dialogRef.close({ updated: 0, remaining } as MissingImagesDialogResult);
      return;
    }

    this.applying.set(true);
    forkJoin(updates).subscribe((results) => {
      for (const result of results) {
        if (result.node) {
          // Update immediately from the PUT response. The WebSocket sends the
          // same update, but relying on it leaves stale degraded badges when
          // notification delivery is delayed or temporarily disconnected.
          this.nodesDataSource.update(result.node);
        }
      }
      const updated = results.filter((result) => result.success).length;
      const stillMissing = results.reduce((count, result) => count + result.remaining, 0);
      this.dialogRef.close({
        updated,
        remaining: remaining + stillMissing,
      } as MissingImagesDialogResult);
    });
  }

  close(): void {
    const remaining = this.groups().reduce((count, group) => count + group.rows.length, 0);
    this.dialogRef.close({ updated: 0, remaining } as MissingImagesDialogResult);
  }
}
