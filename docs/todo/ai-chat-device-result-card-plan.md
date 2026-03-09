# AI Chat Device Result Card Layout Implementation Plan

## Document Information

**Created**: 2026-03-09
**Last Updated**: 2026-03-09 (Added tool_call details support)
**Status**: Planning
**Priority**: HIGH
**Related Docs**:
- [AI Chat UI Optimization Plan](./ai-chat-ui-optimization-plan.md)
- [AI Chat Implementation Plan](./ai-chat-implementation-plan.md)

---

## Overview

Implement a card-based layout for displaying both **tool call details** (what will be executed) and **tool execution results** (what was executed) in the AI Chat tool details dialog. This will replace the current plain text output with a visually organized, per-device card interface.

---

## Current State Analysis

### Problem Statement

**Current Implementation**: `tool-details-dialog.component.ts`

The dialog currently displays tool information in two modes:

1. **Tool Call (`type: 'tool_call'`)**: Shows function name and arguments as JSON
2. **Tool Result (`type: 'tool_result'`)**: Shows tool output as plain text

**Current Issues**:
- All device information merged together
- Newline characters (`\n`) not properly rendered
- Difficult to identify which commands belong to which device
- No visual distinction between different devices
- JSON arguments hard to read for non-technical users

### Data Structures

#### Tool Call (What will be executed)
```typescript
interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;  // e.g., "execute_commands_on_devices"
    arguments: string | Record<string, any>;
    complete?: boolean;
  };
}

// Example arguments for execute_commands_on_devices:
{
  "devices": ["IOU-L3-1", "IOU-L3-2"],
  "commands": ["show ip interface brief", "show interfaces"]
}
```

#### Tool Result (What was executed)
```typescript
interface ToolResultData {
  type: 'tool_result';
  toolName: string;
  toolOutput: DeviceExecutionResult[];
}

interface DeviceExecutionResult {
  device_name: string;      // e.g., "IOU-L3-1"
  status: 'success' | 'error' | 'timeout';
  output: string;           // Command output with \n newlines
  diagnostic_commands: string[];  // Commands executed
}
```

---

## Proposed Solution: Unified Card-Based Layout

### Scenario 1: Tool Call Details (Before Execution)

**Purpose**: Show what commands will be executed on which devices

```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 Tool Call Details                                   [×] │
├─────────────────────────────────────────────────────────────┤
│ Function: execute_commands_on_devices                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Target Devices: 2  |  Commands: 2  |  Status: Pending      │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │  ⏱ IOU-L3-1                                   [📋]  │  │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │  Status: Pending  |  Commands to execute: 2          │  │
│ │  ───────────────────────────────────────────────────  │  │
│ │                                                       │  │
│ │  ┌─ ⏱ Command 1/2 ───────────────────────────┐     │  │
│ │  │ show ip interface brief                   │     │  │
│ │  └────────────────────────────────────────────┘     │  │
│ │                                                       │  │
│ │  ┌─ ⏱ Command 2/2 ───────────────────────────┐     │  │
│ │  │ show interfaces                           │     │  │
│ │  └────────────────────────────────────────────┘     │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │  ⏱ IOU-L3-2                                   [📋]  │  │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │  Status: Pending  |  Commands to execute: 2          │  │
│ │  ───────────────────────────────────────────────────  │  │
│ │  [Collapsed - Click to expand]                        │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ 💡 Arguments Preview:                                     │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ {                                                     │  │
│ │   "devices": ["IOU-L3-1", "IOU-L3-2"],               │  │
│ │   "commands": [                                      │  │
│ │     "show ip interface brief",                       │  │
│ │     "show interfaces"                                │  │
│ │   ]                                                  │  │
│ │ }                                                    │  │
│ └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Scenario 2: Tool Result Details (After Execution)

**Purpose**: Show execution results with status and command output

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ Execution Result Details                              [×] │
├─────────────────────────────────────────────────────────────┤
│ Tool: execute_commands_on_devices                           │
│                                                             │
│ 📊 Summary: 2 Devices  |  ✓ 2 Success  |  ✗ 0 Failed      │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │  ✓ IOU-L3-1                           [▼ Expand] [📋] │  │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │  Status: Success  |  Commands executed: 2              │  │
│ │  ───────────────────────────────────────────────────  │  │
│ │                                                       │  │
│ │  ┌─ ✓ Command 1/2: show ip interface brief ─────┐   │  │
│ │  │ Interface              IP-Address      OK... │   │  │
│ │  │ Ethernet0/0            unassigned      YES... │   │  │
│ │  │ Ethernet0/1            unassigned      YES... │   │  │
│ │  │ [Syntax highlighted output]                │   │  │
│ │  └────────────────────────────────────────────┘   │  │
│ │                                                       │  │
│ │  ┌─ ✓ Command 2/2: show interfaces ──────────┐   │  │
│ │  │ Ethernet0/0 is up, line protocol is up     │   │  │
│ │  │   Hardware is AmdP2, address is aabb...    │   │  │
│ │  │   MTU 1500 bytes, BW 10000 Kbit/sec...    │   │  │
│ │  │ [Syntax highlighted output]                │   │  │
│ │  └────────────────────────────────────────────┘   │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │  ✓ IOU-L3-2                           [▼ Expand] [📋] │  │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │  Status: Success  |  Commands executed: 2              │  │
│ │  ───────────────────────────────────────────────────  │  │
│ │  [Collapsed - Click to expand]                        │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Differences

| Feature | Tool Call | Tool Result |
|---------|-----------|-------------|
| **Icon** | ⏱ (pending) | ✓/✗ (success/error) |
| **Status** | Pending | Success/Error/Timeout |
| **Commands** | Show command list only | Show command + output |
| **Expandability** | Optional (all visible) | Collapsible (large outputs) |
| **Copy** | Copy command list | Copy command output |
| **Colors** | Gray/neutral (pending) | Green/Red (status-based) |

---

## Implementation Plan

### Phase 1: Create Shared Base Components (Day 1)

#### New Component 1: `device-command-card.component.ts`

**Purpose**: Base reusable component for displaying device information

**Usage**:
- For tool_call: Shows pending commands
- For tool_result: Shows execution results with output

```typescript
@Component({
  selector: 'app-device-command-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `./device-command-card.component.html`,
  styleUrls: [`./device-command-card.component.scss`]
})
export class DeviceCommandCardComponent {
  @Input() deviceName: string;
  @Input() status: 'pending' | 'success' | 'error' | 'timeout';
  @Input() commands: CommandItem[];
  @Input() mode: 'call' | 'result';  // NEW: Distinguish call vs result
  @Input() initiallyExpanded = true;

  @Output() copy = new EventEmitter<DeviceCommandCardComponent>();

  isExpanded = false;
  expandedCommands = new Set<number>();

  get icon(): string { /* ... */ }
  get iconColor(): string { /* ... */ }
  get statusText(): string { /* ... */ }
  get headerText(): string { /* ... */ }
}

interface CommandItem {
  command: string;
  output?: string;      // Only for result mode
  highlightedOutput?: SafeHtml;  // Only for result mode
}
```

**Key Features**:
- `mode` input switches between pending/execution display
- Status-based styling (gray for pending, green/red for results)
- Conditional output display (only in result mode)

#### New File: `device-command-card.component.html`

```html
<div class="device-card" [class.mode-call]="mode === 'call'" [class.mode-result]="mode === 'result'">
  <!-- Card Header -->
  <div class="card-header" (click)="toggleExpand()">
    <mat-icon class="status-icon" [ngClass]="iconColor">{{ icon }}</mat-icon>
    <span class="device-name">{{ deviceName }}</span>
    <span class="command-info">
      {{ mode === 'call' ? 'Commands to execute' : 'Commands executed' }}: {{ commands.length }}
    </span>

    <div class="header-actions">
      <button mat-icon-button (click)="$event.stopPropagation(); copy.emit(this)"
              matTooltip="Copy commands" *ngIf="mode === 'call'">
        <mat-icon>content_copy</mat-icon>
      </button>
      <button mat-icon-button (click)="$event.stopPropagation(); copy.emit(this)"
              matTooltip="Copy output" *ngIf="mode === 'result'">
        <mat-icon>content_copy</mat-icon>
      </button>
      <mat-icon class="expand-icon" [class.rotated]="isExpanded">expand_more</mat-icon>
    </div>
  </div>

  <!-- Card Content -->
  <div class="card-content" *ngIf="isExpanded">
    <div class="command-sections">
      <div class="command-section" *ngFor="let cmd of commands; let i = index">
        <!-- Command Header -->
        <div class="command-header" (click)="toggleCommand(i)">
          <mat-icon class="command-icon">{{ mode === 'call' ? 'schedule' : 'check_circle' }}</mat-icon>
          <span class="command-text">
            {{ mode === 'call' ? 'Command' : 'Output for' }} {{ i + 1 }}/{{ commands.length }}: {{ cmd.command }}
          </span>
          <mat-icon [class.rotated]="expandedCommands.has(i)" *ngIf="mode === 'result'">expand_more</mat-icon>
        </div>

        <!-- Command Output (only for result mode) -->
        <div class="command-output" *ngIf="mode === 'result' && expandedCommands.has(i)">
          <pre class="cisco-output" [innerHTML]="cmd.highlightedOutput"></pre>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### New File: `device-command-card.component.scss`

```scss
.device-card {
  background: var(--mat-app-surface-container-low);
  border: 1px solid var(--mat-app-outline-variant);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.3s ease;

  // Call mode - neutral gray
  &.mode-call {
    border-left: 4px solid #9ca3af;
    box-shadow: 0 2px 8px rgba(156, 163, 175, 0.1);
  }

  // Result mode - status-based colors
  &.mode-result.success {
    border-left: 4px solid #22c55e;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
  }

  &.mode-result.error {
    border-left: 4px solid #ef4444;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  background: linear-gradient(to right, var(--mat-app-surface), var(--mat-app-surface-container-low));
  transition: background 0.2s ease;

  &:hover {
    background: var(--mat-app-surface-container);
  }
}

.status-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;

  &.pending { color: #9ca3af; }
  &.success { color: #22c55e; }
  &.error { color: #ef4444; }
  &.timeout { color: #f59e0b; }
}

.device-name {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  font-size: 14px;
  flex: 1;
  color: var(--mat-app-on-surface);
}

.command-info {
  font-size: 12px;
  color: var(--mat-app-on-surface-variant);
}

// Call mode specific styles
.mode-call {
  .command-header {
    background: var(--mat-app-surface);
    border: 1px solid var(--mat-app-outline-variant);
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 8px;
  }

  .command-text {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    color: var(--mat-app-on-surface);
  }
}

// Result mode specific styles
.mode-result {
  .command-output {
    border: 1px solid var(--mat-app-outline-variant);
    border-top: none;
    border-radius: 0 0 8px 8px;
    background: var(--mat-app-surface-container-high);
  }

  .cisco-output {
    margin: 0;
    padding: 12px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: var(--mat-app-on-surface);
  }
}

// Syntax highlighting
.cisco-output {
  .cisco-interface { color: #0ea5e9; font-weight: 500; }
  .cisco-ip { color: #8b5cf6; }
  .cisco-state { color: #22c55e; font-weight: 600; }
  .cisco-command { color: #06b6d4; font-weight: 500; }
  .cisco-errors { color: #ef4444; }
}
```

**File Location**:
```
src/app/components/project-map/ai-chat/device-command-card.component.ts
src/app/components/project-map/ai-chat/device-command-card.component.html
src/app/components/project-map/ai-chat/device-command-card.component.scss
```

---

### Phase 2: Update Tool Details Dialog (Day 1-2)

#### Modify File: `tool-details-dialog.component.ts`

**Changes**:

1. **Import DeviceCommandCardComponent**:
```typescript
import { DeviceCommandCardComponent } from './device-command-card.component';
import { CiscoSyntaxHighlightService } from '@services/cisco-syntax-highlight.service';

imports: [
  CommonModule,
  MatIconModule,
  MatDialogModule,
  MarkdownModule,
  MatButtonModule,
  DeviceCommandCardComponent
],
```

2. **Add Enhanced Type Definitions**:
```typescript
interface DeviceExecutionResult {
  device_name: string;
  status: 'success' | 'error' | 'timeout';
  output: string;
  diagnostic_commands?: string[];
}

interface DeviceCommandTarget {
  device_name: string;
  commands: string[];
}

interface CommandItem {
  command: string;
  output?: string;
  highlightedOutput?: SafeHtml;
}
```

3. **Add Detection Logic for BOTH Call and Result**:
```typescript
constructor(
  public dialogRef: MatDialogRef<ToolDetailsDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: ToolDetailsDialogData,
  private clipboard: Clipboard,
  private ciscoHighlight: CiscoSyntaxHighlightService,  // NEW
  private snackbar: MatSnackBar
) { }

// ========== TOOL CALL DETECTION ==========
get isMultiDeviceToolCall(): boolean {
  if (this.type !== 'tool_call' || !this.toolCall) {
    return false;
  }

  const args = this.parsedArguments;
  if (!args || typeof args !== 'object') {
    return false;
  }

  // Check for execute_commands_on_devices structure
  return 'devices' in args && Array.isArray(args.devices) && 'commands' in args;
}

get deviceCommandTargets(): DeviceCommandTarget[] {
  if (!this.isMultiDeviceToolCall) {
    return [];
  }

  const args = this.parsedArguments as { devices: string[], commands: string[] };
  return args.devices.map(device => ({
    device_name: device,
    commands: args.commands
  }));
}

get toolCallSummary(): { deviceCount: number; commandCount: number } {
  const targets = this.deviceCommandTargets;
  return {
    deviceCount: targets.length,
    commandCount: targets[0]?.commands.length || 0
  };
}

// ========== TOOL RESULT DETECTION ==========
get isDeviceResults(): boolean {
  if (this.type !== 'tool_result' || !this.parsedOutput) {
    return false;
  }

  if (!Array.isArray(this.parsedOutput)) {
    return false;
  }

  // Check if first item has device execution result structure
  const firstItem = this.parsedOutput[0];
  return firstItem &&
         typeof firstItem === 'object' &&
         'device_name' in firstItem &&
         'output' in firstItem;
}

get deviceResults(): DeviceExecutionResult[] {
  return this.parsedOutput;
}

get summaryStats(): { total: number; success: number; failed: number; } {
  if (!this.isDeviceResults) {
    return { total: 0, success: 0, failed: 0 };
  }

  const results = this.deviceResults;
  return {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error' || r.status === 'timeout').length
  };
}

// ========== DATA TRANSFORMATION ==========
get deviceCommandCardsForCall(): DeviceCommandCardData[] {
  return this.deviceCommandTargets.map(target => ({
    deviceName: target.device_name,
    status: 'pending' as const,
    commands: target.commands.map(cmd => ({ command: cmd })),
    mode: 'call' as const
  }));
}

get deviceCommandCardsForResult(): DeviceCommandCardData[] {
  return this.deviceResults.map(result => {
    const commands = this.parseDeviceOutput(result.output, result.diagnostic_commands);
    return {
      deviceName: result.device_name,
      status: result.status,
      commands: commands,
      mode: 'result' as const
    };
  });
}

private parseDeviceOutput(output: string, commandList?: string[]): CommandItem[] {
  if (!commandList || commandList.length === 0) {
    // Try to extract commands from output
    return this.extractCommandsFromOutput(output);
  }

  // Split output by commands
  return commandList.map(cmd => ({
    command: cmd,
    output: this.extractCommandOutput(output, cmd),
    highlightedOutput: this.ciscoHighlight.highlight(
      this.extractCommandOutput(output, cmd)
    )
  }));
}

private extractCommandOutput(fullOutput: string, command: string): string {
  // Find command in output and extract its result
  const commandIndex = fullOutput.indexOf(command);
  if (commandIndex === -1) {
    return fullOutput;
  }

  // Extract from command to next command or end
  const afterCommand = fullOutput.substring(commandIndex);
  const nextCommandIndex = afterCommand.search(/\n[A-Z][a-z]+\d+\/\d+/);  // Next interface pattern

  if (nextCommandIndex === -1) {
    return afterCommand;
  }

  return afterCommand.substring(0, nextCommandIndex);
}
```

4. **Add Copy Functionality**:
```typescript
copyToolCallCommands(): void {
  const targets = this.deviceCommandTargets;
  const commands = targets.map(t =>
    `## ${t.device_name}\n${t.commands.map(c => `- ${c}`).join('\n')}`
  ).join('\n\n');

  this.clipboard.copy(commands);
  this.snackbar.open('Commands copied to clipboard', 'Dismiss', { duration: 2000 });
}

copyDeviceResultCommands(device: DeviceExecutionResult): void {
  this.clipboard.copy(device.output);
  this.snackbar.open(`${device.device_name} output copied`, 'Dismiss', { duration: 2000 });
}

copyAllResults(): void {
  const allOutputs = this.deviceResults
    .map(device => `## ${device.device_name}\n${device.output}`)
    .join('\n\n');

  this.clipboard.copy(allOutputs);
  this.snackbar.open('All outputs copied to clipboard', 'Dismiss', { duration: 2000 });
}
```

#### Modify File: `tool-details-dialog.component.html` (Template)

**Replace both Tool Call and Tool Result sections**:

```html
<!-- ========== TOOL CALL: Multi-Device Commands ========== -->
<ng-container *ngIf="type === 'tool_call' && isMultiDeviceToolCall">
  <div class="info-section">
    <div class="info-label">Function:</div>
    <div class="info-value">{{ toolCall?.function?.name }}</div>
  </div>

  <!-- Summary Bar -->
  <div class="results-summary call-mode">
    <mat-icon class="summary-icon">schedule</mat-icon>
    <span class="summary-item">
      {{ toolCallSummary.deviceCount }} Devices to execute
    </span>
    <span class="summary-item">
      {{ toolCallSummary.commandCount }} Commands per device
    </span>
    <button mat-icon-button (click)="copyToolCallCommands()" matTooltip="Copy all commands">
      <mat-icon>content_copy</mat-icon>
    </button>
  </div>

  <!-- Device Cards -->
  <div class="device-cards-container">
    <app-device-command-card
      *ngFor="let card of deviceCommandCardsForCall; let i = index"
      [deviceName]="card.deviceName"
      [status]="card.status"
      [commands]="card.commands"
      [mode]="card.mode"
      [initiallyExpanded]="i === 0"
      (copy)="copyDeviceResultCommands($event)">
    </app-device-command-card>
  </div>

  <!-- Arguments Preview (collapsible) -->
  <div class="arguments-preview-section">
    <button mat-button (click)="showArguments = !showArguments" class="toggle-button">
      <mat-icon>code</mat-icon>
      {{ showArguments ? 'Hide' : 'Show' }} Raw Arguments
      <mat-icon [class.rotated]="showArguments">expand_more</mat-icon>
    </button>

    <div class="arguments-preview" *ngIf="showArguments">
      <pre class="code-content"><code>{{ formattedArguments }}</code></pre>
    </div>
  </div>
</ng-container>

<!-- ========== TOOL CALL: Fallback (Single Device / Other Tools) ========== -->
<ng-container *ngIf="type === 'tool_call' && !isMultiDeviceToolCall">
  <div class="info-section">
    <div class="info-label">Function:</div>
    <div class="info-value">{{ toolCall?.function?.name }}</div>
  </div>

  <div class="info-section">
    <div class="info-label">Arguments:</div>
    <div class="content-container">
      <ng-container *ngIf="isArgumentsMarkdown">
        <markdown class="markdown-content" [data]="formattedArguments"></markdown>
      </ng-container>
      <pre *ngIf="!isArgumentsMarkdown" class="code-content"><code>{{ formattedArguments }}</code></pre>
    </div>
  </div>
</ng-container>

<!-- ========== TOOL RESULT: Multi-Device Results ========== -->
<ng-container *ngIf="type === 'tool_result' && isDeviceResults">
  <div class="info-section">
    <div class="info-label">Tool:</div>
    <div class="info-value">{{ toolName }}</div>
  </div>

  <!-- Summary Bar -->
  <div class="results-summary result-mode">
    <mat-icon class="summary-icon">analytics</mat-icon>
    <span class="summary-item">
      {{ summaryStats.total }} Devices
    </span>
    <span class="summary-item success">
      <mat-icon>check_circle</mat-icon>
      {{ summaryStats.success }} Success
    </span>
    <span class="summary-item error" *ngIf="summaryStats.failed > 0">
      <mat-icon>error</mat-icon>
      {{ summaryStats.failed }} Failed
    </span>
    <button mat-icon-button (click)="copyAllResults()" matTooltip="Copy all outputs">
      <mat-icon>content_copy</mat-icon>
    </button>
  </div>

  <!-- Device Cards -->
  <div class="device-cards-container">
    <app-device-command-card
      *ngFor="let card of deviceCommandCardsForResult; let i = index"
      [deviceName]="card.deviceName"
      [status]="card.status"
      [commands]="card.commands"
      [mode]="card.mode"
      [initiallyExpanded]="i === 0"
      (copy)="copyDeviceResultCommands($event)">
    </app-device-command-card>
  </div>
</ng-container>

<!-- ========== TOOL RESULT: Fallback (Non-device results) ========== -->
<ng-container *ngIf="type === 'tool_result' && !isDeviceResults">
  <div class="info-section">
    <div class="info-label">Tool:</div>
    <div class="info-value">{{ toolName }}</div>
  </div>

  <div class="info-section">
    <div class="info-label">Output:</div>
    <div class="content-container">
      <ng-container *ngIf="isOutputMarkdown">
        <markdown class="markdown-content" [data]="formattedOutput"></markdown>
      </ng-container>
      <pre *ngIf="!isOutputMarkdown" class="code-content"><code>{{ formattedOutput }}</code></pre>
    </div>
  </div>
</ng-container>
```

#### Add New Styles

```scss
// Summary Bar - Mode Specific
.results-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--mat-app-surface-container-low);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--mat-app-outline-variant);

  &.call-mode {
    background: linear-gradient(to right, rgba(156, 163, 175, 0.1), var(--mat-app-surface-container-low));
    border-color: #9ca3af;
  }

  &.result-mode {
    background: var(--mat-app-surface-container-low);
  }
}

.summary-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  color: var(--mat-app-primary);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--mat-app-on-surface-variant);

  mat-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
  }

  &.success { color: #22c55e; }
  &.error { color: #ef4444; }
}

// Arguments Preview Section
.arguments-preview-section {
  margin-top: 16px;
}

.toggle-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--mat-app-surface-container-low);
  border: 1px solid var(--mat-app-outline-variant);
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--mat-app-surface-container);
  }

  mat-icon:last-child {
    transition: transform 0.3s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.arguments-preview {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
}

// Device Cards Container
.device-cards-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}
```

---

### Phase 3: Syntax Highlighting Service (Day 2)

#### New File: `cisco-syntax-highlight.service.ts`

Same as before - see previous plan for implementation details.

**File Location**:
```
src/app/services/cisco-syntax-highlight.service.ts
```

---

## File Summary

### New Files (4)

| File | Purpose | Lines Estimate |
|------|---------|----------------|
| `device-command-card.component.ts` | Unified device card component (call + result) | ~180 |
| `device-command-card.component.html` | Device card template | ~70 |
| `device-command-card.component.scss` | Device card styles (both modes) | ~250 |
| `cisco-syntax-highlight.service.ts` | Syntax highlighting service | ~100 |

### Modified Files (1)

| File | Changes | Lines Added |
|------|---------|-------------|
| `tool-details-dialog.component.ts` | Add dual-mode detection, data transformation, copy methods | ~150 |
| `tool-details-dialog.component.ts` (template) | Replace both call and result sections | ~80 |
| `tool-details-dialog.component.ts` (styles) | Add mode-specific styles | ~80 |

---

## Impact Analysis

### Positive Impacts ✅

1. **Unified Experience**
   - Consistent UI for both tool call and result
   - Easy to compare what was planned vs what happened
   - Clear visual progression from pending → executed

2. **User Experience**
   - Tool call: See exactly what will execute before it runs
   - Tool result: Clear status indicators per device
   - Collapsible sections reduce scrolling

3. **Debugging**
   - Easy to verify correct devices selected
   - Easy to verify correct commands queued
   - Easy to identify which devices failed

### Potential Risks ⚠️

1. **Argument Detection**
   - Risk: Other tools may have different argument structures
   - Mitigation: Specific check for `devices` + `commands` keys

2. **Output Parsing**
   - Risk: Command output parsing may fail for varied formats
   - Mitigation: Fallback to full output if parsing fails

3. **Component Complexity**
   - Risk: Single component handling two modes may be complex
   - Mitigation: Clear `mode` input separation, type safety

---

## Testing Checklist

### Tool Call Mode
- [ ] Detects multi-device tool calls correctly
- [ ] Shows correct device count
- [ ] Shows correct command count
- [ ] All device cards displayed
- [ ] Commands listed in each card
- [ ] Copy all commands works
- [ ] Copy single device commands works
- [ ] Arguments preview toggle works
- [ ] Fallback for single-device tools works
- [ ] Fallback for other tools works

### Tool Result Mode
- [ ] Detects multi-device results correctly
- [ ] Summary stats correct (total/success/failed)
- [ ] Success status shows green ✓
- [ ] Error status shows red ✗
- [ ] Timeout status shows orange ⚠
- [ ] Expand/collapse device cards works
- [ ] Expand/collapse command outputs works
- [ ] Copy single device output works
- [ ] Copy all outputs works
- [ ] Syntax highlighting applies
- [ ] Fallback for non-device results works

### Shared Functionality
- [ ] Dark theme colors readable
- [ ] Light theme colors readable
- [ ] Mobile responsive
- [ ] Animations smooth
- [ ] Scrollbars work correctly

---

## Implementation Timeline

| Day | Task | Status |
|-----|------|--------|
| 1 | Create DeviceCommandCardComponent (dual mode) | Pending |
| 1 | Update ToolDetailsDialog for tool_call detection | Pending |
| 1 | Update ToolDetailsDialog for tool_result detection | Pending |
| 1 | Add data transformation logic | Pending |
| 2 | Create CiscoSyntaxHighlightService | Pending |
| 2 | Add copy functionality for both modes | Pending |
| 2 | Add toast notifications | Pending |
| 2 | Style refinements and theme support | Pending |
| 2 | Testing and bug fixes | Pending |

**Total Estimated Time**: 2 days

---

## Future Enhancements

1. **Real-time Updates**: Show tool call status change from pending → executing → complete
2. **Progress Bar**: Show execution progress (1/2 devices complete)
3. **Filtering**: Filter devices by status in result mode
4. **Diff View**: Compare commands (call) vs output (result)
5. **Retry**: Re-execute failed commands from tool call view
6. **Export**: Export tool call as script, export results as report

---

**Last Updated**: 2026-03-09 (Added tool_call support)
**Status**: Ready for Implementation
**Maintainer**: Development Team
