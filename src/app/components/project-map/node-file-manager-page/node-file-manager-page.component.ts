import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal,
  computed,
  model,
  viewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { firstValueFrom } from 'rxjs';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Node } from '../../../cartography/models/node';
import { Controller } from '@models/controller';
import { NodeService } from '@services/node.service';
import { ControllerService } from '@services/controller.service';
import { ToasterService } from '@services/toaster.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';

// ── Types ──────────────────────────────────
export interface DirEntry {
  name: string;
  path: string;
  expanded: boolean;
  loading: boolean;
}

export interface NodeFile {
  path: string;
  size: number;
  created_at: string;
  modified_at: string;
  file_type: string;
}

// ── Component ──────────────────────────────
@Component({
  standalone: true,
  selector: 'app-node-file-manager-page',
  templateUrl: './node-file-manager-page.component.html',
  styleUrls: ['./node-file-manager-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    ClipboardModule,
    MatMenuModule,
    MatDividerModule,
  ],
})
export class NodeFileManagerPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private nodeService = inject(NodeService);
  private controllerService = inject(ControllerService);
  private dialog = inject(MatDialog);
  private toaster = inject(ToasterService);
  private clipboard = inject(Clipboard);
  private cd = inject(ChangeDetectorRef);

  // ── Inputs (for inline mode) ──
  readonly inputNode = input<Node | undefined>(undefined);
  readonly inputController = input<Controller | undefined>(undefined);

  // ── Route params ──
  controllerId = '';
  projectId = '';
  nodeId = '';
  nodeName = signal('');

  // ── State ──
  controller = signal<any>(null);
  currentPath = signal('');
  loading = signal(true);
  error = signal<string | null>(null);
  copied = signal<string | null>(null);

  selectedFile = signal<any>(null);
  contextMenuTrigger = viewChild<MatMenuTrigger>('menuTrigger');
  menuPosition = signal({ left: 0, top: 0 });
  editorGutter = viewChild<ElementRef<HTMLElement>>('editorGutter');

  // Upload
  uploading = signal(false);
  uploadProgress = signal(0);

  // Download
  downloading = signal(false);
  downloadProgress = signal(0);

  // Edit
  editingFile = signal<NodeFile | null>(null);
  editContent = model('');
  saving = signal(false);
  loadingContent = signal(false);
  lineCount = signal(1);
  originalLines = signal<string[]>([]);
  currentLines = signal<string[]>([]);

  displayedColumns = ['icon', 'path', 'file_type', 'size', 'modified_at'];

  // ── Directory cache ──
  dirCache = signal<Map<string, any[]>>(new Map());

  private setDirCache(path: string, entries: any[]) {
    const map = this.dirCache();
    map.set(path, entries);
    this.dirCache.set(new Map(map));
  }

  private getDirCache(path: string): any[] {
    return this.dirCache().get(path) || [];
  }

  // ── Derived ──
  breadcrumbs = computed(() => {
    const parts = this.currentPath().split('/').filter(Boolean);
    const crumbs: { label: string; path: string }[] = [{ label: 'root', path: '' }];
    let acc = '';
    for (const p of parts) {
      acc = acc ? `${acc}/${p}` : p;
      crumbs.push({ label: p, path: acc });
    }
    return crumbs;
  });

  currentFiles = computed(() => {
    const entries = this.getDirCache(this.currentPath());
    return entries.filter((f: any) => f.file_type !== 'directory');
  });

  subdirs = computed(() => {
    const entries = this.getDirCache(this.currentPath());
    return entries
      .filter((f: any) => f.file_type === 'directory')
      .map((d: any) => ({
        name: d.path.split('/').pop()!,
        path: d.path,
      }));
  });

  viewItems = computed(() => {
    const dirs = this.subdirs().map((d) => ({
      isDir: true as const,
      name: d.name,
      path: d.path,
      size: 0,
      created_at: '',
      modified_at: '',
      file_type: 'directory',
    }));
    const files = this.currentFiles().map((f: any) => ({ isDir: false as const, name: this.fileName(f), ...f }));
    return [...dirs, ...files];
  });

  // ── Tree nodes (loaded directories list) ──
  treeNodes = signal<DirEntry[]>([]);

  expandedDirs = signal<Set<string>>(new Set());

  expandDir(node: DirEntry) {
    const expanded = this.expandedDirs();
    if (expanded.has(node.path)) {
      // Collapse: hide children, keep current directory
      expanded.delete(node.path);
      this.expandedDirs.set(new Set(expanded));
      return;
    }
    // Expand: show children and navigate
    this.navigateToDir(node.path);
    expanded.add(node.path);
    this.expandedDirs.set(new Set(expanded));
    if (!this.dirCache().has(node.path)) {
      this.loadDir(node.path);
    }
  }

  private addToTree(dirPath: string, entries: any[]) {
    const tree = this.treeNodes();
    const exists = tree.some((n) => n.path === dirPath);
    if (exists) return;
    const name = dirPath.split('/').pop() || dirPath;
    tree.push({ name, path: dirPath, expanded: false, loading: false });
    tree.sort((a, b) => a.path.localeCompare(b.path));
    this.treeNodes.set([...tree]);
  }

  isExpanded(path: string): boolean {
    return this.expandedDirs().has(path);
  }

  treeDepth(path: string): number {
    return path.split('/').length;
  }

  isNodeVisible(node: DirEntry): boolean {
    const parts = node.path.split('/');
    for (let i = 1; i < parts.length; i++) {
      if (!this.expandedDirs().has(parts.slice(0, i).join('/'))) {
        return false;
      }
    }
    return true;
  }

  treeIsLastChild(path: string): boolean {
    const parts = path.split('/');
    const parent = parts.slice(0, -1).join('/');
    const siblings = this.treeNodes().filter((n) => {
      const np = n.path.split('/');
      np.pop();
      return np.join('/') === parent;
    });
    return siblings.length > 0 && siblings[siblings.length - 1].path === path;
  }

  // ── Lifecycle ──
  ngOnInit() {
    const inNode = this.inputNode();
    const inCtrl = this.inputController();

    if (inNode && inCtrl) {
      this.controllerId = inCtrl.id?.toString() || '';
      this.projectId = inNode.project_id;
      this.nodeId = inNode.node_id;
      this.nodeName.set(inNode.name);
      this.controller.set(inCtrl);
      this.loadFiles();
    } else {
      this.controllerId = this.route.snapshot.paramMap.get('controller_id')!;
      this.projectId = this.route.snapshot.paramMap.get('project_id')!;
      this.nodeId = this.route.snapshot.paramMap.get('node_id')!;
      this.nodeName.set(this.route.snapshot.queryParamMap.get('name') || this.nodeId);

      this.controllerService.get(+this.controllerId).then(
        (c) => {
          this.controller.set(c);
          this.loadFiles();
        },
        () => {
          this.loading.set(false);
          this.toaster.error('Failed to load controller');
          this.cd.markForCheck();
        }
      );
    }
  }

  // ── File ops ──
  loadFiles() {
    this.loading.set(true);
    this.error.set(null);
    this.dirCache.set(new Map());
    this.treeNodes.set([]);
    const ctrl = this.controller();
    this.nodeService.getNodeFiles(ctrl, this.projectId, this.nodeId).subscribe({
      next: (entries) => {
        this.setDirCache('', entries);
        for (const e of entries) {
          if (e.file_type === 'directory') this.addToTree(e.path, []);
        }
        this.loading.set(false);
        this.cd.markForCheck();
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Failed to load files');
        this.loading.set(false);
        this.cd.markForCheck();
      },
    });
  }

  loadDir(dirPath: string) {
    const path = dirPath.endsWith('/') ? dirPath : dirPath + '/';
    const ctrl = this.controller();
    this.nodeService.getNodeFiles(ctrl, this.projectId, this.nodeId, path).subscribe({
      next: (entries) => {
        this.setDirCache(dirPath, entries);
        for (const e of entries) {
          if (e.file_type === 'directory') this.addToTree(e.path, []);
        }
        this.cd.markForCheck();
      },
      error: (err) => {
        this.toaster.error(err.error?.message || err.message || 'Failed to load directory');
      },
    });
  }

  navigateToDir(path: string) {
    this.currentPath.set(path);
    if (!this.getDirCache(path).length) {
      this.loadDir(path);
    }
  }

  fileName(file: NodeFile): string {
    const p = this.currentPath();
    return p ? file.path.substring(p.length + 1) : file.path;
  }

  shortFileType(type: string): string {
    return type.split(' ').slice(0, 2).join(' ');
  }

  isEditableFile(file: NodeFile): boolean {
    return file.file_type.includes('ASCII') || file.file_type.includes('UTF-8') || file.file_type.includes('text');
  }

  formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  formatDate(dateString: string): string {
    return dateString ? new Date(dateString).toLocaleString() : '-';
  }

  copyPath(path: string) {
    this.clipboard.copy(path);
    this.copied.set(path);
    setTimeout(() => this.copied.set(null), 2000);
  }

  onRowContextMenu(event: MouseEvent, file: any) {
    event.preventDefault();
    this.selectedFile.set(file);
    this.menuPosition.set({ left: event.clientX, top: event.clientY });
    const trigger = this.contextMenuTrigger();
    if (trigger) {
      trigger.menuData = { file };
      trigger.openMenu();
    }
  }

  // ── Edit ──
  editFile(file: NodeFile) {
    this.editingFile.set(file);
    this.editContent.set('');
    this.loadingContent.set(true);
    const ctrl = this.controller();
    this.nodeService.getNodeFileContent(ctrl, this.projectId, this.nodeId, file.path).subscribe({
      next: (content) => {
        this.editContent.set(content);
        this.originalLines.set(content.split('\n'));
        this.currentLines.set(content.split('\n'));
        this.loadingContent.set(false);
        this.updateLineCount(content);
        this.cd.markForCheck();
      },
      error: (err) => {
        this.toaster.error(err.error?.message || err.message || 'Failed to load file');
        this.loadingContent.set(false);
        this.cancelEdit();
        this.cd.markForCheck();
      },
    });
  }

  saveEdit() {
    const file = this.editingFile();
    if (!file) return;
    this.saving.set(true);
    const ctrl = this.controller();
    this.nodeService.saveNodeFileContent(ctrl, this.projectId, this.nodeId, file.path, this.editContent()).subscribe({
      next: () => {
        this.toaster.success(`File "${file.path}" saved.`);
        this.saving.set(false);
        this.editingFile.set(null);
        this.loadFiles();
        this.cd.markForCheck();
      },
      error: (err) => {
        this.toaster.error(err.error?.message || err.message || 'Failed to save file');
        this.saving.set(false);
        this.cd.markForCheck();
      },
    });
  }

  cancelEdit() {
    this.editingFile.set(null);
    this.editContent.set('');
  }

  onEditorScroll(event: Event) {
    const textarea = event.target as HTMLElement;
    const gutter = this.editorGutter()?.nativeElement;
    if (gutter) gutter.scrollTop = textarea.scrollTop;
  }

  updateLineCount(content: string) {
    this.lineCount.set((content.match(/\n/g) || []).length + 1);
  }

  onContentChange(value: string) {
    this.editContent.set(value);
    this.currentLines.set(value.split('\n'));
    this.updateLineCount(value);
  }

  getLineState(num: number): 'modified' | 'added' | 'unchanged' {
    const orig = this.originalLines(),
      curr = this.currentLines();
    const idx = num - 1;
    if (idx < orig.length && idx < curr.length) return orig[idx] !== curr[idx] ? 'modified' : 'unchanged';
    return idx < curr.length ? 'added' : 'unchanged';
  }

  lineNumbers(): number[] {
    return Array.from({ length: this.lineCount() }, (_, i) => i + 1);
  }

  // ── Upload ──
  onUploadClick() {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', (e) => {
      this.onFileSelected(e);
      document.body.removeChild(input);
    });
    input.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.uploading.set(true);
    this.uploadProgress.set(0);
    const ctrl = this.controller();
    const uploadPath = this.currentPath() ? `${this.currentPath()}/${file.name}` : file.name;
    this.nodeService.uploadNodeFileWithProgress(ctrl, this.projectId, this.nodeId, uploadPath, file).subscribe({
      next: (p) => {
        this.uploadProgress.set(p);
        this.cd.markForCheck();
      },
      error: (err) => {
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.toaster.error(err.message || 'Upload failed');
        this.cd.markForCheck();
      },
      complete: () => {
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.toaster.success(`File "${file.name}" uploaded.`);
        // Add to current dir cache without full reload
        const current = this.getDirCache(this.currentPath());
        const newFile = { path: uploadPath, size: file.size, created_at: '', modified_at: '', file_type: 'ASCII text' };
        this.setDirCache(this.currentPath(), [...current, newFile]);
        this.cd.markForCheck();
      },
    });
  }

  // ── Download ──
  async downloadFile(file: NodeFile) {
    const picker = (window as any).showSaveFilePicker as ((o: any) => Promise<any>) | undefined;

    // Chromium File System Access API path
    if (picker) {
      let handle: any;
      try {
        handle = await picker({ suggestedName: file.path });
      } catch {
        return;
      }
      this.downloading.set(true);
      this.downloadProgress.set(0);
      try {
        await this.nodeService.streamNodeFileToFile(
          this.controller(),
          this.projectId,
          this.nodeId,
          file.path,
          handle,
          (d) => {
            this.downloadProgress.set(file.size > 0 ? Math.min(Math.round((d / file.size) * 100), 100) : 0);
            this.cd.markForCheck();
          }
        );
        this.downloading.set(false);
        this.downloadProgress.set(0);
        this.toaster.success(`File "${file.path}" downloaded.`);
        this.cd.markForCheck();
      } catch (err: any) {
        this.downloading.set(false);
        this.downloadProgress.set(0);
        this.toaster.error(err.message || 'Download failed');
        this.cd.markForCheck();
      }
      return;
    }

    // Fallback: traditional <a> download for Firefox/Safari
    this.downloading.set(true);
    this.downloadProgress.set(0);
    try {
      const blob = await firstValueFrom(
        this.nodeService.downloadNodeFile(this.controller(), this.projectId, this.nodeId, file.path)
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.path;
      a.click();
      URL.revokeObjectURL(url);
      this.downloading.set(false);
      this.toaster.success(`File "${file.path}" downloaded.`);
      this.cd.markForCheck();
    } catch (err: any) {
      this.downloading.set(false);
      this.toaster.error(err.message || 'Download failed');
      this.cd.markForCheck();
    }
  }

  // ── Delete ──
  deleteFile(file: any) {
    const isDir = file.isDir || file.file_type === 'directory';
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
      data: {
        title: isDir ? 'Delete directory' : 'Delete file',
        message: `Are you sure you want to delete "${file.path}"?${
          isDir ? ' This will permanently remove the directory and all its contents.' : ''
        }`,
        confirmButtonText: isDir ? 'Delete directory' : 'Delete',
        cancelButtonText: 'Cancel',
      },
    });
    ref.afterClosed().subscribe((r) => {
      if (!r) return;
      const ctrl = this.controller();
      this.nodeService.deleteNodeFile(ctrl, this.projectId, this.nodeId, file.path).subscribe({
        next: () => {
          this.toaster.success(`File "${file.path}" deleted.`);
          // Remove from dirCache (pure signal)
          const parentDir = file.path.split('/').slice(0, -1).join('/');
          const parent = this.getDirCache(parentDir).filter((e: any) => e.path !== file.path);
          this.setDirCache(parentDir, parent);
          // If current directory was deleted, go to parent
          if (this.currentPath().startsWith(file.path)) {
            this.currentPath.set(parentDir);
          }
          // Remove from tree nodes
          if (file.isDir || file.file_type === 'directory') {
            this.treeNodes.set(
              this.treeNodes().filter((n) => n.path !== file.path && !n.path.startsWith(file.path + '/'))
            );
          }
          this.cd.markForCheck();
        },
        error: (err) => {
          this.toaster.error(err.error?.message || err.message || 'Delete failed');
          this.cd.markForCheck();
        },
      });
    });
  }
}
