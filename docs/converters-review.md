# Converters Directory - 代码审查文档 / Code Review Documentation

---

**文档生成时间 / Document Generated**: 2026-03-07
**审查工具 / Review Tool**: Claude Code (Sonnet 4.5)
**审查范围 / Review Scope**: src/app/converters/ (数据转换器 / Data Converters)

---

## 概述 / Overview

**中文说明**：本目录包含数据转换器，在不同模型和数据结构之间进行转换、数据格式化、业务逻辑封装。

**English Description**: This directory contains data converters for transforming between different models and data structures, formatting data, and encapsulating business logic.

---

## 模块功能 / Module Functions


### 转换器类型

#### **基础接口**
- `converter.ts` - 定义转换器接口 `Converter<TSource, TDestination>`

#### **主要转换器**
- **Symbol 相关**: `symbol-to-map-symbol-converter.ts`, `map-symbol-to-symbol-converter.ts`
- **Port 相关**: `port-to-map-port-converter.ts`, `map-port-to-port-converter.ts`
- **Node 相关**: `node-to-map-node-converter.ts`
- **Drawing 相关**: `map-drawing-to-svg-converter.ts`
- **Label 相关**: `label-to-map-label-converter.ts`
- **Style 相关**: `styles-to-font-converter.ts`

---

## 发现的问题 / Issues Found

### 🔴 严重安全问题 / Security Issues

#### 1. **SVG 注入风险**
**文件**: `cartography/converters/map/map-drawing-to-svg-converter.ts:17,19,23`

**问题描述**:
```typescript
elem = `<rect fill="${mapDrawing.element.fill}" ... />`;
// 直接将用户输入嵌入 SVG
```

**修复建议**:
```typescript
import { DomSanitizer, SecurityContext } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {}

private sanitizeSvgAttribute(value: string): string {
  return this.sanitizer.sanitize(SecurityContext.HTML, value) || '';
}

convert(mapDrawing: MapDrawing): string {
  const cleanFill = this.sanitizeSvgAttribute(mapDrawing.element.fill);
  elem = `<rect fill="${cleanFill}" ... />`;
}
```

---

### 🟠 代码质量问题 / Code Quality Issues

#### 2. **参数名拼写错误**
**文件**: `cartography/converters/map/label-to-map-label-converter.ts:16`

**问题描述**:
```typescript
convert(label: Label, paramaters?: { [node_id: string]: string })
// paramaters 应为 parameters
```

**修复建议**:
```typescript
convert(label: Label, parameters?: { [node_id: string]: string })
```

#### 3. **硬编码魔法数字**
**文件**: `cartography/converters/map/node-to-map-node-converter.ts:58-59`

**问题描述**:
```typescript
mapNode.label.x = node.width / 2 - box.width / 2 + 3;  // 硬编码 3
mapNode.label.y = -8;  // 硬编码 -8
```

**修复建议**:
```typescript
// 定义常量
const LABEL_OFFSET_X = 3;
const LABEL_OFFSET_Y = -8;
const DEFAULT_LABEL_Y = -8;

mapNode.label.x = node.width / 2 - box.width / 2 + LABEL_OFFSET_X;
mapNode.label.y = node.label.y === null ? DEFAULT_LABEL_Y : node.label.y;
```

#### 4. **空值检查不一致**
**文件**: `cartography/converters/map/node-to-map-node-converter.ts:57-60`

**问题描述**:
```typescript
if (node.label.x === null || node.label.y === null) {
  // 使用 === null
} else if (mapLabel.x !== null) {
  // 使用 !== null
}
```

**修复建议**:
```typescript
// 统一使用宽松相等
if (node.label.x == null || node.label.y == null) {
  // ...
}

if (mapLabel.x != null) {
  mapLabel.x += LABEL_OFFSET_X;
}
```

#### 5. **复杂的三元运算符**
**文件**: `cartography/converters/map/map-drawing-to-svg-converter.ts:17,19`

**问题描述**:
```typescript
elem = `${mapDrawing.element.stroke_dasharray == '' ? `<rect fill="..."/>` : `<rect fill="..."/>`}`;
```

**修复建议**:
```typescript
if (mapDrawing.element.stroke_dasharray === '') {
  elem = this.createRect(mapDrawing.element, false);
} else {
  elem = this.createRect(mapDrawing.element, true);
}

private createRect(element: any, hasDash: boolean): string {
  const attrs = {
    fill: element.fill,
    stroke: hasDash ? element.stroke : 'none',
    'stroke-dasharray': hasDash ? element.stroke_dasharray : 'none'
  };
  return `<rect ${this.formatAttributes(attrs)} />`;
}
```

#### 6. **未验证的数据类型转换**
**文件**: `cartography/converters/styles-to-font-converter.ts:21-23`

**问题描述**:
```typescript
if (value.type === 'Dimension') {
  font.font_size = parseInt(value.value);  // 没有验证结果
}
```

**修复建议**:
```typescript
if (value.type === 'Dimension') {
  const size = parseInt(value.value, 10);
  if (isNaN(size)) {
    console.warn('Invalid font size:', value.value);
    font.font_size = 12;  // 默认值
  } else {
    font.font_size = size;
  }
}
```

---

## 修复建议 / Recommendations

### 优先级 1 - 安全修复

#### 1. SVG 安全处理
```typescript
import { DomSanitizer, SecurityContext } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SafeSvgConverter {
  constructor(private sanitizer: DomSanitizer) {}

  convert(mapDrawing: MapDrawing): string {
    const sanitized = this.sanitizeDrawing(mapDrawing);
    return this.buildSvg(sanitized);
  }

  private sanitizeDrawing(drawing: MapDrawing): MapDrawing {
    return {
      ...drawing,
      element: {
        ...drawing.element,
        fill: this.sanitizeValue(drawing.element.fill),
        stroke: this.sanitizeValue(drawing.element.stroke)
      }
    };
  }

  private sanitizeValue(value: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, value) || '';
  }
}
```

### 优先级 2 - 代码质量改进

#### 1. 创建基础转换器类
```typescript
export abstract class BaseConverter<TSource, TDestination> implements Converter<TSource, TDestination> {
  abstract convert(from: TSource): TDestination;

  convertSafe(from: TSource): { success: boolean; result?: TDestination; error?: string } {
    try {
      const result = this.convert(from);
      return { success: true, result };
    } catch (error) {
      console.error('Conversion error:', error);
      return { success: false, error: error.message };
    }
  }
}
```

#### 2. 添加常量文件
```typescript
// converter.constants.ts
export const CONVERTER_CONSTANTS = {
  LABEL: {
    OFFSET_X: 3,
    OFFSET_Y: -8,
    DEFAULT_Y: -8
  },
  SVG: {
    DEFAULT_WIDTH: 100,
    DEFAULT_HEIGHT: 100
  }
};
```

#### 3. 改进错误处理
```typescript
convert(from: TSource): TDestination {
  if (!from) {
    throw new Error('Source object is null or undefined');
  }

  try {
    return this.performConversion(from);
  } catch (error) {
    console.error('Conversion failed:', {
      source: from,
      error
    });
    throw error;
  }
}

protected abstract performConversion(from: TSource): TDestination;
```

---

## 测试建议

```typescript
describe('NodeToMapNodeConverter', () => {
  it('should handle null label coordinates', () => {
    const node = createNodeWithNullLabel();
    const mapNode = converter.convert(node);
    expect(mapNode.label.y).toBe(CONVERTER_CONSTANTS.LABEL.DEFAULT_Y);
  });

  it('should sanitize SVG attributes', () => {
    const drawing = createMaliciousDrawing();
    const svg = svgConverter.convert(drawing);
    expect(svg).not.toContain('<script>');
  });
});
```
