# Template Component - 模板组件代码审查 / Code Review Documentation

---

**文档生成时间 / Document Generated**: 2026-03-07
**审查工具 / Review Tool**: Claude Code (Sonnet 4.5)
**审查范围 / Review Scope**: src/app/components/template/ (Template Component)

---

## 概述 / Overview

**中文说明**：模板组件负责设备模板管理，包括模板浏览、选择、搜索和拖拽创建功能。

**English Description**: Template component handles device template management, including template browsing, selection, search, and drag-to-drop creation.

---

## 模块功能 / Module Functions


### 主要组件

#### **TemplateComponent**
- 模板浏览器
- 分类展示（内置、Docker、QEMU、VirtualBox 等）
- 模板搜索和过滤
- 拖拽创建节点

---

## 发现的问题 / Issues Found

### 🔴 安全问题 / Security Issues

#### 1. **XSS 风险 - SVG 处理**
**文件**: `template.component.ts`

**问题描述**:
```typescript
const svgData = btoa(unescape(encodeURIComponent(svgString)));
// SVG 内容未经过净化
```

**修复建议**:
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

#### 2. **拖拽坐标验证不足**
**文件**: `template.component.ts`

**问题描述**: 拖拽坐标可能被恶意操控

**修复建议**:
```typescript
private validateDropCoordinates(x: number, y: number): boolean {
  // 验证坐标在合理范围内
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

  // 继续处理
}
```

#### 3. **文件上传验证缺失**
**文件**: 模板导入相关代码

**修复建议**:
```typescript
validateTemplateFile(file: File): boolean {
  // 文件类型验证
  const validExtensions = ['.gns3template', '.zip'];
  const hasValidExtension = validExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    this.toasterService.error('Invalid file type');
    return false;
  }

  // 文件大小验证（最大 100MB）
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    this.toasterService.error('File too large (max 100MB)');
    return false;
  }

  return true;
}
```

---

### 🟠 代码质量问题 / Code Quality Issues

#### 4. **硬编码模板类型**
**文件**: `template.component.ts:28-40`

**问题描述**:
```typescript
templateTypes = [
  { type: 'cloud', icon: 'cloud', name: 'Cloud' },
  { type: 'ethernet_hub', icon: 'hub', name: 'Ethernet hub' },
  // ... 硬编码
];
```

**修复建议**:
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

#### 5. **内存泄漏**
**文件**: `template.component.ts`

**问题描述**: 订阅未清理

**修复建议**:
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

#### 6. **性能问题 - 重复获取 SVG**
**文件**: `template.component.ts`

**问题描述**: 每次拖拽都重新获取 SVG

**修复建议**:
```typescript
export class TemplateComponent {
  private svgCache = new Map<string, string>();

  async getTemplateSvg(templateId: string): Promise<string> {
    // 检查缓存
    if (this.svgCache.has(templateId)) {
      return this.svgCache.get(templateId)!;
    }

    // 获取 SVG
    const svg = await this.symbolService.getTemplateSymbol(templateId).toPromise();

    // 缓存
    this.svgCache.set(templateId, svg);

    return svg;
  }

  ngOnDestroy() {
    this.svgCache.clear();
  }
}
```

---

## 修复建议 / Recommendations

### 优先级 1 - 立即修复

#### 1. 净化 SVG 内容
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

#### 2. 验证拖拽坐标
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

### 优先级 2 - 短期改进

#### 1. 实现 SVG 缓存
```typescript
@Injectable({ providedIn: 'root' })
export class TemplateSvgCache {
  private cache = new Map<string, Observable<string>>();
  private ttl = 10 * 60 * 1000; // 10 分钟

  get(templateId: string, fetcher: () => Observable<string>): Observable<string> {
    if (this.cache.has(templateId)) {
      return this.cache.get(templateId)!;
    }

    const source = fetcher().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.cache.set(templateId, source);

    // 定期清理
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

#### 2. 改进拖拽性能
```typescript
// 使用防抖
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

## 测试建议

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
