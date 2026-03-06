import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * JSON Viewer Component
 * Displays JSON data with syntax highlighting and collapsible nodes
 * Inspired by FlowNet-Lab JsonView component
 */
@Component({
  selector: 'app-json-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="json-viewer">
      <ng-container *ngFor="let item of parsedData">
        <div [class]="item.class" [style.padding-left.px]="item.indent">
          <span
            *ngIf="item.expandable"
            class="toggle-icon"
            (click)="toggleExpand(item.key)"
          >
            {{ item.expanded ? '▼' : '▶' }}
          </span>
          <span *ngIf="item.key" class="json-key">"{{ item.key }}":</span>
          <span [class]="item.typeClass">{{ item.value }}</span>
          <span *ngIf="item.comma">{{ item.comma }}</span>
        </div>
        <div *ngIf="item.expandable && item.expanded && item.children" [style.padding-left.px]="item.indent + 16">
          <ng-container *ngFor="let child of item.children">
            <div [class]="child.class">
              <span
                *ngIf="child.expandable"
                class="toggle-icon"
                (click)="toggleExpand(child.key, item.key)"
              >
                {{ child.expanded ? '▼' : '▶' }}
              </span>
              <span *ngIf="child.key" class="json-key">"{{ child.key }}":</span>
              <span [class]="child.typeClass">{{ child.value }}</span>
              <span *ngIf="child.comma">{{ child.comma }}</span>
            </div>
          </ng-container>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .json-viewer {
      font-family: 'Monaco', 'Menlo', 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: var(--mat-app-on-surface);
      white-space: pre-wrap;
      word-break: break-all;
    }

    .toggle-icon {
      display: inline-block;
      width: 16px;
      color: var(--mat-app-primary);
      cursor: pointer;
      user-select: none;
      margin-right: 4px;
      transition: transform 0.2s ease;
    }

    .toggle-icon:hover {
      transform: scale(1.1);
    }

    .json-key {
      color: #0451a5;
      font-weight: 500;
    }

    .json-string {
      color: #a31515;
    }

    .json-number {
      color: #098658;
    }

    .json-boolean {
      color: #0000ff;
      font-weight: 600;
    }

    .json-null {
      color: #808080;
      font-style: italic;
    }

    .json-bracket {
      color: var(--mat-app-on-surface);
    }

    .json-item {
      display: flex;
      align-items: flex-start;
    }

    .json-comma {
      color: var(--mat-app-on-surface);
    }
  `]
})
export class JsonViewerComponent implements OnChanges {
  @Input() data: any;
  @Input() expandDepth = 2;

  parsedData: any[] = [];
  private expandedNodes = new Set<string>();

  ngOnChanges() {
    this.parseData();
  }

  private parseData() {
    if (!this.data) {
      this.parsedData = [];
      return;
    }

    const json = typeof this.data === 'string' ? this.data : JSON.stringify(this.data, null, 2);
    this.parsedData = this.parseJsonLines(json.split('\n'), 0);
  }

  private parseJsonLines(lines: string[], baseIndent: number): any[] {
    const result: any[] = [];
    const stack: any[] = [];
    let currentParent: any = null;

    for (const line of lines) {
      const indent = line.search(/\S/);

      if (currentParent && indent <= currentParent.indent) {
        stack.pop();
        currentParent = stack.length > 0 ? stack[stack.length - 1] : null;
      }

      const item = this.parseLine(line, indent, baseIndent);

      if (item.expandable) {
        this.expandedNodes.add(item.key);
        item.expanded = indent / 2 < this.expandDepth;
      }

      if (currentParent && currentParent.expandable) {
        if (!currentParent.children) {
          currentParent.children = [];
        }
        currentParent.children.push(item);
      } else {
        result.push(item);
      }

      if (item.expandable) {
        stack.push(item);
        currentParent = item;
      }
    }

    return result;
  }

  private parseLine(line: string, indent: number, baseIndent: number): any {
    const trimmed = line.trim();
    const item: any = {
      indent: indent - baseIndent,
      class: 'json-item'
    };

    // Check for opening bracket/brace
    if (trimmed === '{' || trimmed === '[') {
      item.expandable = true;
      item.value = trimmed;
      item.typeClass = 'json-bracket';
      item.key = this.generateKey();
      return item;
    }

    // Check for closing bracket/brace
    if (trimmed === '}' || trimmed === ']') {
      item.value = trimmed;
      item.typeClass = 'json-bracket';
      return item;
    }

    // Parse key-value pairs
    const keyMatch = trimmed.match(/^"([^"]+)":\s*(.*)/);
    if (keyMatch) {
      item.key = keyMatch[1];
      const value = keyMatch[2];

      // Check if value is an opening bracket/brace
      if (value === '{' || value === '[') {
        item.expandable = true;
        item.value = value;
        item.typeClass = 'json-bracket';
        item.comma = value.endsWith(',') ? ',' : '';
      } else {
        const parsedValue = this.parseValue(value);
        item.value = parsedValue.value;
        item.typeClass = parsedValue.typeClass;
        item.comma = value.endsWith(',') ? ',' : '';
      }
    } else {
      const parsedValue = this.parseValue(trimmed);
      item.value = parsedValue.value;
      item.typeClass = parsedValue.typeClass;
      item.comma = trimmed.endsWith(',') ? ',' : '';
    }

    return item;
  }

  private parseValue(value: string): { value: string; typeClass: string } {
    const trimmed = value.trim();

    // String
    if (trimmed.startsWith('"')) {
      return { value: trimmed, typeClass: 'json-string' };
    }

    // Boolean
    if (trimmed === 'true' || trimmed === 'false') {
      return { value: trimmed, typeClass: 'json-boolean' };
    }

    // Null
    if (trimmed === 'null') {
      return { value: trimmed, typeClass: 'json-null' };
    }

    // Number
    if (/^\d+\.?\d*$/.test(trimmed)) {
      return { value: trimmed, typeClass: 'json-number' };
    }

    // Default
    return { value: trimmed, typeClass: '' };
  }

  toggleExpand(key: string, parentKey?: string) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    if (this.expandedNodes.has(fullKey)) {
      this.expandedNodes.delete(fullKey);
    } else {
      this.expandedNodes.add(fullKey);
    }
    this.parseData();
  }

  private generateKey(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
