import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ErrorStateMatcher } from '@angular/material/core';
import { Filter } from '@models/filter';
import { FilterDescription, Parameter } from '@models/filter-description';
import { Link } from '@models/link';
import { Message } from '@models/message';
import { Project } from '@models/project';
import { Controller } from '@models/controller';
import { LinkService } from '@services/link.service';
import { HelpDialogComponent } from '../../help-dialog/help-dialog.component';
import { DialogConfigService } from '@services/dialog-config.service';
import { ToasterService } from '@services/toaster.service';

/** Control type derived from a filter Parameter. */
export type ParamControlKind = 'number' | 'text' | 'textarea' | 'select';

/** Editable view state for one filter parameter. */
export interface FilterParamView {
  name: string;
  kind: ParamControlKind;
  unit: string;
  minimum?: number;
  maximum?: number;
  value: number | string;
  options: string[];
  errorMatcher: ErrorStateMatcher;
}

/** Editable view state for one filter (a group of parameters). */
export interface FilterGroupView {
  key: string; // FilterDescription.type — the key used in the filters dict
  name: string;
  isWide: boolean;
  params: FilterParamView[];
}

/** Error state driven by our own validation instead of form directives. */
class FilterParamErrorMatcher implements ErrorStateMatcher {
  constructor(private readonly isError: () => boolean) {}

  isErrorState(): boolean {
    return this.isError();
  }
}

// Jitter distributions of the netem delay filter (server vocabulary).
const NETEM_DISTRIBUTIONS = ['uniform', 'normal', 'pareto', 'paretonormal'];

// Mirror of the server's kernel-only filter set, used ONLY to explain why a
// kernel-datapath link offers fewer filters (the available_filters list
// itself always stays authoritative).
const KERNEL_ONLY_FILTER_TYPES = ['rate', 'reorder', 'gemodel', 'duplicate', 'seed', 'limit', 'quota', 'window_drop'];

@Component({
  selector: 'app-packet-filters',
  templateUrl: './packet-filters.component.html',
  styleUrl: './packet-filters.component.scss',
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PacketFiltersDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PacketFiltersDialogComponent>);
  private linkService = inject(LinkService);
  private dialog = inject(MatDialog);
  private dialogConfig = inject(DialogConfigService);
  private cdr = inject(ChangeDetectorRef);
  private toasterService = inject(ToasterService);

  readonly isApplying = signal(false);
  /** Advanced (kernel-only) filters are collapsed by default. */
  readonly showAdvanced = signal(false);

  controller: Controller;
  project: Project;
  link: Link;
  availableFilters: FilterDescription[];
  filterGroups?: FilterGroupView[];
  basicGroups: FilterGroupView[] = [];
  advancedGroups: FilterGroupView[] = [];
  capabilityHint?: string | null;

  private activeFilters?: Filter;

  constructor() {}

  ngOnInit() {
    this.linkService.getLink(this.controller, this.link.project_id, this.link.link_id).subscribe({
      next: (link: Link) => {
        this.link = link;
        this.activeFilters = link.filters ?? {};
        this.tryBuildFilterGroups();
        this.cdr.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load link filters';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });

    this.linkService.getAvailableFilters(this.controller, this.link).subscribe({
      next: (availableFilters: FilterDescription[]) => {
        this.availableFilters = availableFilters;
        this.tryBuildFilterGroups();
        this.cdr.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to load available filters';
        this.toasterService.error(message);
        // Resolve to the empty state instead of spinning forever.
        this.availableFilters = [];
        this.tryBuildFilterGroups();
        this.cdr.markForCheck();
      },
    });
  }

  onParamChange(param: FilterParamView, value: string | number) {
    param.value = value;
    this.cdr.markForCheck();
  }

  paramError(group: FilterGroupView, param: FilterParamView): string | null {
    return this.computeGroupResult(group).errors.get(param) ?? null;
  }

  hasValidationErrors(): boolean {
    return (this.filterGroups ?? []).some((group) => this.computeGroupResult(group).errors.size > 0);
  }

  toggleAdvanced() {
    this.showAdvanced.set(!this.showAdvanced());
    this.cdr.markForCheck();
  }

  onNoClick() {
    this.dialogRef.close();
  }

  onResetClick() {
    this.link.filters = {};

    this.linkService.updateLink(this.controller, this.link).subscribe({
      next: (link: Link) => {
        this.toasterService.success('Packet filters reset.');
        this.dialogRef.close();
        this.cdr.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to reset filters';
        this.toasterService.error(message);
        this.cdr.markForCheck();
      },
    });
  }

  onYesClick() {
    if (this.isApplying() || !this.filterGroups) return;
    if (this.hasValidationErrors()) {
      // A blocked apply must never leave the offending fields hidden.
      this.revealErroredAdvancedGroups();
      this.cdr.markForCheck();
      return;
    }
    this.link.filters = this.buildFiltersPayload();
    this.isApplying.set(true);
    this.dialogRef.disableClose = true;
    this.linkService.updateLink(this.controller, this.link).subscribe({
      next: (link: Link) => {
        this.toasterService.success('Packet filters applied.');
        this.dialogRef.close();
        this.cdr.markForCheck();
      },
      error: (err) => {
        const message = err.error?.message || err.message || 'Failed to apply filters';
        this.toasterService.error(message);
        this.isApplying.set(false);
        this.dialogRef.disableClose = false;
        this.cdr.markForCheck();
      },
    });
  }

  onHelpClick() {
    const dialogConfig = this.dialogConfig.openConfig('helpDialog', {
      autoFocus: false,
      disableClose: true,
    });
    const dialogRef = this.dialog.open(HelpDialogComponent, dialogConfig);
    let instance = dialogRef.componentInstance;
    instance.title = 'Help for filters';
    instance.messages = this.buildHelpMessages();
  }

  /**
   * The Help dialog carries the full filter reference (per-filter
   * descriptions and parameter ranges) so the form itself stays compact.
   */
  private buildHelpMessages(): Message[] {
    const messages: Message[] = [
      {
        name: 'How packet filters work',
        description: [
          'A value of 0 (or an empty field) disables a filter; only the filters you set are applied.',
          'Percentages apply to each direction of the link independently — a 30% packet loss drops roughly 51% of round-trip traffic.',
          'Time-based schedules restart from the moment a filter is applied: changing any filter or restarting a node resets them.',
        ].join('\n'),
      },
    ];
    this.availableFilters.forEach((filter: FilterDescription) => {
      messages.push({
        name: filter.name,
        description: this.describeFilter(filter),
      });
    });
    return messages;
  }

  private describeFilter(filter: FilterDescription): string {
    const lines = [filter.description ?? '', '', 'Parameters:'];
    for (const parameter of filter.parameters ?? []) {
      lines.push(`- ${this.describeParameter(parameter)}`);
    }
    return lines.join('\n');
  }

  private describeParameter(parameter: Parameter): string {
    const unit = parameter.unit ? ` (${parameter.unit})` : '';
    if (parameter.type === 'int' && parameter.minimum !== undefined && parameter.maximum !== undefined) {
      return `${parameter.name}${unit}: ${parameter.minimum} to ${parameter.maximum}`;
    }
    if (parameter.type === 'text') {
      return `${parameter.name}: one expression per line`;
    }
    return `${parameter.name}${unit}`;
  }

  private tryBuildFilterGroups() {
    if (!this.activeFilters || !this.availableFilters) return;
    this.filterGroups = this.buildFilterGroups(this.availableFilters, this.activeFilters);
    this.basicGroups = this.filterGroups.filter((group) => !this.isAdvancedGroup(group));
    this.advancedGroups = this.filterGroups.filter((group) => this.isAdvancedGroup(group));
    // Advanced filters already active on the link stay visible (and editable).
    if (this.advancedGroups.some((group) => this.activeFilters?.[group.key])) {
      this.showAdvanced.set(true);
    }
    this.capabilityHint = this.buildCapabilityHint(this.link?.kernel_datapath, this.availableFilters);
  }

  private isAdvancedGroup(group: FilterGroupView): boolean {
    return KERNEL_ONLY_FILTER_TYPES.includes(group.key);
  }

  /** Expand the advanced section when it holds a validation error. */
  private revealErroredAdvancedGroups() {
    if (this.showAdvanced()) return;
    if (this.advancedGroups.some((group) => this.computeGroupResult(group).errors.size > 0)) {
      this.showAdvanced.set(true);
    }
  }

  private buildFilterGroups(descriptions: FilterDescription[], active: Filter): FilterGroupView[] {
    return descriptions.map((description) => {
      const activeValues = active[description.type] ?? [];
      const params: FilterParamView[] = (description.parameters ?? []).map((parameter: Parameter, index: number) => {
        const kind = this.paramKind(parameter);
        return {
          name: parameter.name,
          kind,
          unit: parameter.unit ?? '',
          minimum: parameter.minimum,
          maximum: parameter.maximum,
          value:
            kind === 'textarea'
              ? activeValues.length
                ? activeValues.map(String).join('\n')
                : ''
              : index < activeValues.length
                ? activeValues[index]
                : kind === 'number'
                  ? 0
                  : '',
          options: kind === 'select' ? [...NETEM_DISTRIBUTIONS] : [],
          errorMatcher: undefined as unknown as ErrorStateMatcher,
        };
      });
      const group: FilterGroupView = {
        key: description.type,
        name: description.name,
        // Full-width block: text filters (bpf) and groups with too many
        // parameters to fit a grid column (window_drop) — their parameters
        // still lay out in a single comfortable row.
        isWide: params.length >= 3 || params.some((param) => param.kind === 'textarea'),
        params,
      };
      params.forEach((param) => {
        param.errorMatcher = new FilterParamErrorMatcher(() => this.paramError(group, param) !== null);
      });
      return group;
    });
  }

  private paramKind(parameter: Parameter): ParamControlKind {
    if (parameter.type === 'int') return 'number';
    if (parameter.type === 'text') return 'textarea';
    if (parameter.name.trim().toLowerCase() === 'distribution') return 'select';
    return 'text';
  }

  /**
   * Truncate trailing blank values (0 / empty — the server treats them as
   * "parameter not set"), then validate the surviving values against the
   * advertised minimum/maximum. Zero values that survive truncation (e.g.
   * window_drop Start) are validated honestly.
   */
  private computeGroupResult(group: FilterGroupView): { values: (number | string)[]; errors: Map<FilterParamView, string> } {
    const errors = new Map<FilterParamView, string>();
    const values: (number | string)[] = [];
    const raw = group.params.map((param) => param.value);
    let length = raw.length;
    while (length > 0 && this.isBlankFor(group.params[length - 1], raw[length - 1])) length--;

    for (let i = 0; i < length; i++) {
      const param = group.params[i];
      const value = raw[i];
      if (param.kind === 'number') {
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n) || !Number.isInteger(n)) {
          errors.set(param, 'Enter a whole number');
          values.push(value);
        } else if (param.minimum !== undefined && n < param.minimum) {
          errors.set(
            param,
            param.maximum !== undefined ? `Value must be between ${param.minimum} and ${param.maximum}` : `Value must be at least ${param.minimum}`
          );
          values.push(n);
        } else if (param.maximum !== undefined && n > param.maximum) {
          errors.set(param, `Value must be at most ${param.maximum}`);
          values.push(n);
        } else {
          values.push(n);
        }
      } else {
        values.push(String(value));
      }
    }
    return { values, errors };
  }

  private isBlankFor(param: FilterParamView, value: number | string): boolean {
    if (param.kind === 'number') {
      return value === '' || value === null || value === undefined || Number(value) === 0;
    }
    return typeof value === 'string' && value.trim() === '';
  }

  private buildFiltersPayload(): Filter {
    const payload: Filter = {};
    for (const group of this.filterGroups ?? []) {
      const { values } = this.computeGroupResult(group);
      if (!values.length) continue;
      // bpf and any future text filter: one element holding the multi-line
      // string. Layout width (isWide) is unrelated to the value encoding.
      if (group.params.some((param) => param.kind === 'textarea')) payload[group.key] = [String(values[0]).trim()];
      else payload[group.key] = values;
    }
    return payload;
  }

  /**
   * Explain, from kernel_datapath × the offered filter set, why extended
   * filters may be missing (undefined on old servers — nothing to tell).
   */
  private buildCapabilityHint(kernelDatapath: boolean | undefined, descriptions: FilterDescription[]): string | null {
    if (kernelDatapath === undefined) return null;
    if (!kernelDatapath) {
      return 'This link runs on the uBridge relay; the extended impairment filters run on kernel-datapath links only.';
    }
    const offered = new Set(descriptions.map((description) => description.type));
    if (KERNEL_ONLY_FILTER_TYPES.some((type) => !offered.has(type))) {
      return "Some impairment filters are unavailable because the uBridge on the link's computes does not support them.";
    }
    return null;
  }
}
