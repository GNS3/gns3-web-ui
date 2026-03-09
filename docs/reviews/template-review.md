# Template Component - Code Review Documentation

---

**Document Generated**: 2026-03-07
**Review Tool**: Claude Code (Sonnet 4.5)
**Review Scope**: src/app/components/template/ (Template Component)

---

## Overview

Template component handles device template management, including template browsing, selection, search, and drag-to-drop creation.

---

## Module Functions


### Main Components

#### **TemplateComponent**
- Template browser
- Category display (built-in, Docker, QEMU, VirtualBox, etc.)
- Template search and filtering
- Drag-to-drop node creation

---

## Issues Found

### Security Issues

#### 1. **XSS Risk - SVG Handling**
**File**: `template.component.ts`

**Description**:
```typescript
const svgData = btoa(unescape(encodeURIComponent(svgString)));
// SVG content not sanitized
```

**Fix Recommendation**:
```typescript
import DOMPurify from 'dompurify';

private sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    ALLOWED_TAGS: ['svg', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'text', 'g'],
    ALLOWED_ATTR: ['d', 'x', 'y', 'cx', 'cy', 'r', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'transform'],
    ALLOW_DATA_ATTR: false
  });
}

processSvg(svgString: string): string {
  const cleanSvg = this.sanitizeSvg(svgString);
  return btoa(unescape(encodeURIComponent(cleanSvg)));
}
```

#### 2. **Insufficient Drag Coordinate Validation**
**File**: `template.component.ts`

**Description**: Drag coordinates could be maliciously manipulated

**Fix Recommendation**:
```typescript
private validateDropCoordinates(x: number, y: number): boolean {
  // Validate coordinates are within reasonable range
  const MAX_COORDINATE = 100000;
  const MIN_COORDINATE = -100000;

  return (
    !isNaN(x) && !isNaN(y) &&
    x >= MIN_COORDINATE && x <= MAX_COORDINATE &&
    y >= MIN_COORDINATE && y <= MAX_COORDINATE
  );
}

onDrop(event: DragEvent) {
  const x = event.offsetX;
  const y = event.offsetY;

  if (!this.validateDropCoordinates(x, y)) {
    console.warn('Invalid drop coordinates:', { x, y });
    return;
  }

  // Continue processing
}
```

#### 3. **Missing File Upload Validation**
**File**: Template import related code

**Fix Recommendation**:
```typescript
validateTemplateFile(file: File): boolean {
  // File type validation
  const validExtensions = ['.gns3template', '.zip'];
  const hasValidExtension = validExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    this.toasterService.error('Invalid file type');
    return false;
  }

  // File size validation (max 100MB)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    this.toasterService.error('File too large (max 100MB)');
    return false;
  }

  return true;
}
```

---

### Code Quality Issues

#### 4. **Hardcoded Template Types**
**File**: `template.component.ts:28-40`

**Description**:
```typescript
templateTypes = [
  { type: 'cloud', icon: 'cloud', name: 'Cloud' },
  { type: 'ethernet_hub', icon: 'hub', name: 'Ethernet hub' },
  // ... hardcoded
];
```

**Fix Recommendation**:
```typescript
// template-types.config.ts
export const TEMPLATE_TYPES = [
  { type: 'cloud', icon: 'cloud', name: 'Cloud' },
  { type: 'ethernet_hub', icon: 'hub', name: 'Ethernet hub' },
  { type: 'ethernet_switch', icon: 'switch', name: 'Ethernet switch' },
  { type: 'docker', icon: 'docker', name: 'Docker' },
  { type: 'qemu', icon: 'server', name: 'QEMU' },
  { type: 'virtualbox', icon: 'virtualbox', name: 'VirtualBox' },
  { type: 'vmware', icon: 'vmware', name: 'VMware' },
  { type: 'dynamips', icon: 'router', name: 'Dynamips' },
  { type: 'vpcs', icon: 'laptop', name: 'VPCS' },
  { type: 'iou', icon: 'router', name: 'IOU' }
];

// template.component.ts
import { TEMPLATE_TYPES } from './template-types.config';

templateTypes = TEMPLATE_TYPES;
```

#### 5. **Memory Leak**
**File**: `template.component.ts`

**Description**: Subscriptions not cleaned up

**Fix Recommendation**:
```typescript
export class TemplateComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.templateService.getTemplates(this.controller).pipe(
      takeUntil(this.destroy$)
    ).subscribe(templates => {
      this.templates = templates;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

#### 6. **Performance Issue - Repeated SVG Fetching**
**File**: `template.component.ts`

**Description**: Fetches SVG again on every drag

**Fix Recommendation**:
```typescript
export class TemplateComponent {
  private svgCache = new Map<string, string>();

  async getTemplateSvg(templateId: string): Promise<string> {
    // Check cache
    if (this.svgCache.has(templateId)) {
      return this.svgCache.get(templateId)!;
    }

    // Fetch SVG
    const svg = await this.symbolService.getTemplateSymbol(templateId).toPromise();

    // Cache
    this.svgCache.set(templateId, svg);

    return svg;
  }

  ngOnDestroy() {
    this.svgCache.clear();
  }
}
```

---

## Recommendations

### Priority 1 - Immediate Fixes

#### 1. Sanitize SVG Content
```typescript
import DOMPurify from 'dompurify';

private sanitizeSvg(svg: string): string {
  const clean = DOMPurify.sanitize(svg, {
    ALLOWED_TAGS: ['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'text'],
    ALLOWED_ATTR: ['d', 'x', 'y', 'cx', 'cy', 'r', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'transform'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false
  });
  return clean;
}
```

#### 2. Validate Drag Coordinates
```typescript
private validateCoordinates(x: number, y: number): boolean {
  const isValidNumber = (n: number) => typeof n === 'number' && !isNaN(n) && isFinite(n);

  return isValidNumber(x) && isValidNumber(y);
}

onDrop(event: DragEvent) {
  const x = event.offsetX;
  const y = event.offsetY;

  if (!this.validateCoordinates(x, y)) {
    console.warn('Invalid drag coordinates');
    return;
  }

  this.createNode(x, y);
}
```

### Priority 2 - Short-term Improvements

#### 1. Implement SVG Caching
```typescript
@Injectable({ providedIn: 'root' })
export class TemplateSvgCache {
  private cache = new Map<string, Observable<string>>();
  private ttl = 10 * 60 * 1000; // 10 minutes

  get(templateId: string, fetcher: () => Observable<string>): Observable<string> {
    if (this.cache.has(templateId)) {
      return this.cache.get(templateId)!;
    }

    const source = fetcher().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.cache.set(templateId, source);

    // Periodic cleanup
    setTimeout(() => {
      this.cache.delete(templateId);
    }, this.ttl);

    return source;
  }

  clear() {
    this.cache.clear();
  }
}
```

#### 2. Improve Drag Performance
```typescript
// Use debounce
private dragEnd$ = new Subject<DragEvent>();

ngOnInit() {
  this.dragEnd$.pipe(
    debounceTime(50),
    takeUntil(this.destroy$)
  ).subscribe(event => {
    this.handleDrop(event);
  });
}

onDragEnd(event: DragEvent) {
  this.dragEnd$.next(event);
}
```

---

## Testing Recommendations

```typescript
describe('TemplateComponent', () => {
  it('should sanitize malicious SVG', () => {
    const malicious = '<svg><script>alert("xss")</script></svg>';
    const clean = component.sanitizeSvg(malicious);
    expect(clean).not.toContain('<script>');
  });

  it('should reject invalid drag coordinates', () => {
    expect(component.validateCoordinates(NaN, 100)).toBe(false);
    expect(component.validateCoordinates(100, Infinity)).toBe(false);
    expect(component.validateCoordinates(100, 100)).toBe(true);
  });
});
```
