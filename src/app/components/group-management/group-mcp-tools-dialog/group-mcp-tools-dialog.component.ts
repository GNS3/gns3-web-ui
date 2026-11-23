/*
 * Software Name : GNS3 Web UI
 * Version: 3
 * SPDX-FileCopyrightText: Copyright (c) 2022 Orange Business Services
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This software is distributed under the GPL-3.0 or any later version,
 * the text of which is available at https://www.gnu.org/licenses/gpl-3.0.txt
 * or see the "LICENSE" file for more details.
 */

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';

import { Controller } from '@models/controller';
import { Group } from '@models/groups/group';
import { GroupMcpToolsResponse } from '@models/groups/group-mcp-tools';
import { GroupService } from '@services/group.service';
import { ToasterService } from '@services/toaster.service';
import { ControllerError } from '@services/http-controller.service';
import { ConfirmationDialogComponent } from '@components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { HasPrivilegeDirective } from '@directives/has-privilege.directive';
import { MCP_TOOL_CATEGORY_ORDER, mcpToolCategory, mcpToolCategoryIcon } from './mcp-tool-categories';

export interface GroupMcpToolsDialogData {
  group: Group;
  controller: Controller;
}

interface McpToolView {
  name: string;
  description: string;
}

interface McpToolGroup {
  category: string;
  tools: McpToolView[];
}

@Component({
  selector: 'app-group-mcp-tools-dialog',
  standalone: true,
  templateUrl: './group-mcp-tools-dialog.component.html',
  styleUrl: './group-mcp-tools-dialog.component.scss',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    HasPrivilegeDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupMcpToolsDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<GroupMcpToolsDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as GroupMcpToolsDialogData;

  private groupService = inject(GroupService);
  private toasterService = inject(ToasterService);
  private dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly candidates = signal<string[]>([]);
  /** Server state: null = never configured, otherwise the stored whitelist (may contain stale names). */
  readonly tools = signal<string[] | null>(null);
  /** UI selection (starts as tools ∩ candidates; submitted verbatim on save). */
  readonly selected = signal<Set<string>>(new Set());
  readonly filterText = signal('');
  /** Tool descriptions keyed by name, delivered by the server with the candidates. */
  readonly descriptions = signal<Record<string, string>>({});
  /** True when the whitelist cannot affect anyone (no non-superadmin member right now). */
  readonly bypass = signal(false);
  /** Categories the admin opened manually; while filtering, matched groups show expanded regardless. */
  readonly expandedGroups = signal<Set<string>>(new Set());

  readonly isFilterActive = computed(() => this.filterText().trim().length > 0);

  /** Whitelist entries that fell outside candidates (permission change) — dropped on next save. */
  readonly staleTools = computed<string[]>(() => {
    const stored = this.tools();
    if (stored === null) {
      return [];
    }
    const candidateSet = new Set(this.candidates());
    return stored.filter((name) => !candidateSet.has(name));
  });

  /** What the server currently enforces, as a comparable selection. */
  private readonly savedSelection = computed<Set<string>>(() => {
    const stored = this.tools();
    if (stored === null) {
      return new Set();
    }
    const candidateSet = new Set(this.candidates());
    return new Set(stored.filter((name) => candidateSet.has(name)));
  });

  /**
   * Stale entries are pruned by the next save (the server replaces the
   * whitelist with the submitted intersection), so their mere presence is a
   * pending change: without this the banner's "removed when you save" could
   * never be acted on — Save stayed disabled because the comparable
   * selections were already equal.
   */
  readonly isDirty = computed(
    () => this.staleTools().length > 0 || !this.setsEqual(this.selected(), this.savedSelection())
  );

  readonly whitelistState = computed<'unconfigured' | 'configured' | 'deny-all'>(() => {
    const stored = this.tools();
    if (stored === null) {
      return 'unconfigured';
    }
    return stored.length === 0 ? 'deny-all' : 'configured';
  });

  /** Candidates grouped by category and filtered by the search box. */
  readonly toolGroups = computed<McpToolGroup[]>(() => {
    const filter = this.filterText().trim().toLowerCase();
    const descriptions = this.descriptions();
    const byCategory = new Map<string, McpToolView[]>();
    for (const name of this.candidates()) {
      const description = descriptions[name] ?? '';
      if (
        filter.length > 0 &&
        !name.toLowerCase().includes(filter) &&
        !description.toLowerCase().includes(filter)
      ) {
        continue;
      }
      const category = mcpToolCategory(name);
      const group = byCategory.get(category) ?? [];
      group.push({ name, description });
      byCategory.set(category, group);
    }
    const ordered: McpToolGroup[] = [];
    for (const category of MCP_TOOL_CATEGORY_ORDER) {
      const tools = byCategory.get(category);
      if (tools !== undefined) {
        ordered.push({ category, tools });
        byCategory.delete(category);
      }
    }
    // Categories missing from the catalog (new server tools) keep a stable tail order.
    for (const [category, tools] of byCategory) {
      ordered.push({ category, tools });
    }
    return ordered;
  });

  ngOnInit(): void {
    this.load();
  }

  close(): void {
    this.dialogRef.close();
  }

  isSelected(name: string): boolean {
    return this.selected().has(name);
  }

  toggle(name: string, checked: boolean): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(name);
      } else {
        next.delete(name);
      }
      return next;
    });
  }

  categoryIcon(category: string): string {
    return mcpToolCategoryIcon(category);
  }

  isGroupExpanded(category: string): boolean {
    return this.isFilterActive() || this.expandedGroups().has(category);
  }

  setGroupExpanded(category: string, expanded: boolean): void {
    this.expandedGroups.update((current) => {
      const next = new Set(current);
      if (expanded) {
        next.add(category);
      } else {
        next.delete(category);
      }
      return next;
    });
  }

  isGroupFullySelected(tools: McpToolView[]): boolean {
    const selection = this.selected();
    return tools.length > 0 && tools.every((tool) => selection.has(tool.name));
  }

  isGroupPartlySelected(tools: McpToolView[]): boolean {
    const selection = this.selected();
    return !this.isGroupFullySelected(tools) && tools.some((tool) => selection.has(tool.name));
  }

  selectedCountInGroup(tools: McpToolView[]): number {
    const selection = this.selected();
    return tools.filter((tool) => selection.has(tool.name)).length;
  }

  toggleGroup(tools: McpToolView[], checked: boolean): void {
    this.selected.update((current) => {
      const next = new Set(current);
      for (const tool of tools) {
        if (checked) {
          next.add(tool.name);
        } else {
          next.delete(tool.name);
        }
      }
      return next;
    });
  }

  save(): void {
    const selection = [...this.selected()];
    if (selection.length === 0) {
      this.confirmDenyAll();
      return;
    }
    this.saveSelection(selection);
  }

  removeRestriction(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-warning-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Remove MCP tool restriction?',
        message: `The whitelist of "${this.data.group.name}" will be removed and its members will again see every MCP tool allowed by the group's permissions.`,
        confirmButtonText: 'Remove restriction',
        tone: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.saving.set(true);
      this.groupService.clearMcpTools(this.data.controller, this.data.group.user_group_id).subscribe({
        next: () => {
          this.saving.set(false);
          this.tools.set(null);
          this.selected.set(new Set());
          this.toasterService.success('MCP tool restriction removed');
        },
        error: (error) => this.handleError(error, 'Failed to remove MCP tool restriction'),
      });
    });
  }

  private load(): void {
    this.loading.set(true);
    this.groupService.getMcpTools(this.data.controller, this.data.group.user_group_id).subscribe({
      next: (response: GroupMcpToolsResponse) => this.applyResponse(response),
      error: (error) => {
        this.loading.set(false);
        this.toasterService.error(error.message || 'Failed to load MCP tools');
      },
    });
  }

  private applyResponse(response: GroupMcpToolsResponse): void {
    this.loading.set(false);
    this.candidates.set(response.candidates ?? []);
    this.tools.set(response.tools ?? null);
    this.descriptions.set(response.descriptions ?? {});
    this.bypass.set(response.bypass ?? false);
    const candidateSet = new Set(this.candidates());
    this.selected.set(new Set((response.tools ?? []).filter((name) => candidateSet.has(name))));
    // Start with the sections that already contain selected tools expanded.
    const expanded = new Set<string>();
    for (const name of this.selected()) {
      expanded.add(mcpToolCategory(name));
    }
    this.expandedGroups.set(expanded);
  }

  private confirmDenyAll(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      panelClass: ['base-confirmation-dialog-panel', 'confirmation-danger-panel', 'dialog-small-panel'],
      autoFocus: '.cancel-button',
      data: {
        title: 'Deny all MCP tools?',
        message: `Members of "${this.data.group.name}" will not see any MCP tool.`,
        note: 'Saving an empty list is an explicit deny-all, not "unconfigured". Use "Remove restriction" to lift the limit.',
        confirmButtonText: 'Save (deny all)',
        tone: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.saveSelection([]);
      }
    });
  }

  private saveSelection(selection: string[]): void {
    this.saving.set(true);
    this.groupService
      .updateMcpTools(this.data.controller, this.data.group.user_group_id, selection)
      .subscribe({
        next: (response: GroupMcpToolsResponse) => {
          this.saving.set(false);
          this.applyResponse(response);
          this.toasterService.success(
            'MCP tool whitelist saved. Members of multiple groups stay unrestricted while any of their groups has no whitelist.'
          );
        },
        error: (error) => this.handleError(error, 'Failed to save MCP tool whitelist'),
      });
  }

  private handleError(error: unknown, defaultMessage: string): void {
    this.saving.set(false);
    const message = error instanceof Error ? error.message : defaultMessage;
    this.toasterService.error(message || defaultMessage);
    // 400 = selection left the current candidates (concurrent permission change):
    // the message lists the offending tool names — reload so the list matches
    // what the server will accept.
    if (error instanceof ControllerError && (error.originalError as HttpErrorResponse | undefined)?.status === 400) {
      this.load();
    }
  }

  private setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) {
      return false;
    }
    for (const name of a) {
      if (!b.has(name)) {
        return false;
      }
    }
    return true;
  }
}
