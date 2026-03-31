# 硬编码颜色违规清单

> 检测时间：2026-03-31
> 检查范围：`.scss`, `.ts`, `.html` 文件
> 排除文件：测试文件 (`.spec.ts`)、`theme.service.ts`、`index.html`

## 📊 总览

- **总违规数**：40
- **涉及文件**：10
- **优先级**：AI Chat 组件 > 其他组件

---

## 🔴 优先级 1：AI Chat 组件 (25个)

### 1. chat-input-area.component.ts (19个)

**文件路径**：`src/app/components/project-map/ai-chat/chat-input-area.component.ts`

#### 违规详情

| 行号 | 硬编码颜色 | 上下文 | 用途 |
|------|-----------|--------|------|
| 181 | `rgba(var(--mat-sys-primary-rgb), 0.1)` | `box-shadow` | 输入框焦点阴影 |
| 207 | `#00bcd4, #0097a7` | `linear-gradient` | 模型选择器背景渐变 |
| 208 | `white` | `color` | 模型选择器文字颜色 |
| 214 | `rgba(0, 188, 212, 0.3)` | `box-shadow` | 模型选择器阴影 |
| 218 | `13px` | `font-size` | 模型选择器字体大小 |
| 229 | `rgba(255, 255, 255, 0.2)` | `linear-gradient` | 模型选择器光泽效果 |
| 229 | `rgba(255, 255, 255, 0)` | `linear-gradient` | 模型选择器光泽效果 |
| 236 | `rgba(0, 188, 212, 0.5)` | `box-shadow` | 悬停阴影 |
| 237 | `#00bcd4, #00838f` | `linear-gradient` | 悬停背景渐变 |
| 247 | `rgba(0, 188, 212, 0.3)` | `box-shadow` | 激活阴影 |
| 257-259 | `16px` | `width, height, font-size` | 图标尺寸 |
| 274-276 | `18px` | `width, height, font-size` | 图标尺寸 |
| 283-284 | `48px` | `width, height` | 按钮尺寸 |
| 287 | `#00bcd4, #7c4dff` | `linear-gradient` | 附件按钮渐变 |
| 294 | `rgba(124, 77, 255, 0.3)` | `box-shadow` | 附件按钮阴影 |
| 306 | `rgba(255, 255, 255, 0.2)` | `linear-gradient` | 附件按钮光泽效果 |
| 306 | `rgba(255, 255, 255, 0)` | `linear-gradient` | 附件按钮光泽效果 |
| 314 | `rgba(124, 77, 255, 0.5)` | `box-shadow` | 悬停阴影 |
| 315 | `#7c4dff, #651fff` | `linear-gradient` | 悬停渐变 |
| 324 | `rgba(124, 77, 255, 0.3)` | `box-shadow` | 激活阴影 |
| 396 | `rgba(var(--mat-sys-primary-rgb), 0.1)` | `box-shadow` | 发送按钮阴影 |
| 403 | `rgba(var(--mat-sys-primary-rgb), 0.2)` | `box-shadow` | 发送按钮悬停阴影 |

#### 问题代码示例

```typescript
// 第 207-208 行
style += `
  .model-selector-chip {
    background: linear-gradient(135deg, #00bcd4, #0097a7);
    color: white;
  }
`;

// 第 287 行
style += `
  .attachment-btn {
    background: linear-gradient(135deg, var(--mat-sys-primary), #7c4dff);
  }
`;
```

#### 修复建议

1. **创建 SCSS 文件**：`chat-input-area.component.scss`
2. **将所有样式移到 SCSS 文件**
3. **使用 CSS 变量替换硬编码颜色**

```scss
// chat-input-area.component.scss
.model-selector-chip {
  background: linear-gradient(
    135deg,
    var(--mat-sys-primary),
    var(--mat-sys-primary-container)
  );
  color: var(--mat-sys-on-primary);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--mat-sys-primary) 30%, transparent);
  font-size: 13px;

  &:hover {
    background: linear-gradient(
      135deg,
      var(--mat-sys-primary),
      color-mix(in srgb, var(--mat-sys-primary-container) 80%, black)
    );
    box-shadow: 0 4px 12px color-mix(in srgb, var(--mat-sys-primary) 50%, transparent);
  }

  &::before {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--mat-sys-on-primary) 20%, transparent),
      transparent
    );
  }
}

.attachment-btn {
  background: linear-gradient(
    135deg,
    var(--mat-sys-primary),
    var(--mat-sys-tertiary)
  );
  box-shadow: 0 4px 12px color-mix(in srgb, var(--mat-sys-tertiary) 30%, transparent);

  &:hover {
    background: linear-gradient(
      135deg,
      var(--mat-sys-tertiary),
      color-mix(in srgb, var(--mat-sys-tertiary) 80%, black)
    );
  }

  &::before {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--mat-sys-on-surface) 20%, transparent),
      transparent
    );
  }
}
```

---

### 2. tool-call-display.component.ts (6个)

**文件路径**：`src/app/components/project-map/ai-chat/tool-call-display.component.ts`

#### 违规详情

| 行号 | 硬编码颜色 | 用途 |
|------|-----------|------|
| 44 | `#0ea5e9` | 工具调用边框颜色 |
| 49 | `13px` | 字体大小 |
| 53 | `rgba(14, 165, 233, 0.08)` | 工具调用背景色 |
| 54 | `#0ea5e9` | 工具调用边框颜色 |
| 56 | `rgba(14, 165, 233, 0.15)` | 工具调用阴影 |
| 60-63 | `16px` | 图标尺寸 |
| 68 | `12px` | 字体大小 |
| 77 | `11px` | 字体大小 |
| 82 | `#f59e0b` | 警告颜色 |
| 86 | `#8b5cf6` | 信息颜色 |
| 90 | `11px` | 字体大小 |
| 94-96 | `14px` | 图标尺寸 |

#### 修复建议

创建 `tool-call-display.component.scss`：

```scss
.tool-call-item {
  border-left: 3px solid var(--mat-sys-primary);
  background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
  border-color: var(--mat-sys-primary);
  box-shadow: 0 3px 10px color-mix(in srgb, var(--mat-sys-primary) 15%, transparent);

  .tool-icon {
    color: var(--mat-sys-primary);
  }

  .tool-warning {
    color: var(--mat-sys-tertiary); // 或使用警告色变量
  }

  .tool-info {
    color: var(--mat-sys-secondary);
  }
}
```

---

### 3. chat-session-list.component.ts (2个)

**文件路径**：`src/app/components/project-map/ai-chat/chat-session-list.component.ts`

#### 违规详情

| 行号 | 硬编码颜色 | 用途 |
|------|-----------|------|
| 225 | `rgba(0, 151, 167, 0.1)` | 会话项背景色 |
| 225 | `rgba(0, 151, 167, 0.3)` | 会话项边框色 |
| 253 | `rgba(0, 151, 167, 0.4)` | 悬停背景色 |

#### 修复建议

创建 `chat-session-list.component.scss`：

```scss
.chat-session-item {
  background: color-mix(in srgb, var(--mat-sys-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--mat-sys-primary) 30%, transparent);

  &:hover {
    background: color-mix(in srgb, var(--mat-sys-primary) 40%, transparent);
  }
}
```

---

## 🟡 优先级 2：其他组件 (15个)

### 4. interface-status.ts (6个)

**文件路径**：`src/app/cartography/widgets/interface-status.ts`

#### 违规详情

| 行号 | 硬编码颜色 | 用途 |
|------|-----------|------|
| 21 | `#E2E8FF` | 默认背景色 |
| 121 | `#111111` | 文字颜色 |
| 144 | `#2ecc71` | 启动状态（绿色） |
| 181 | `#FFFF00` | 暂停状态（黄色） |
| 199 | `#2ecc71` | 启动状态 |
| 204 | `#FFFF00` | 暂停状态 |
| 264 | `#111111` | 文字颜色 |

#### 修复建议

使用 Material 状态颜色变量或创建自定义变量：

```scss
// _interface-status.scss
.interface-status {
  --status-bg: var(--mat-sys-surface-container);
  --status-text: var(--mat-sys-on-surface);
  --status-started: #4caf50; // 或 var(--mat-sys-primary)
  --status-suspended: #ffeb3b; // 或 var(--mat-sys-tertiary)
}
```

---

### 5. text-editor.component.ts (2个)

**文件路径**：
- `src/app/cartography/components/text-editor/text-editor.component.ts`
- `src/app/components/project-map/drawings-editors/text-editor/text-editor.component.ts`

#### 违规详情

| 行号 | 硬编码颜色 | 用途 |
|------|-----------|------|
| 184 | `#000000` | 默认文字颜色 |
| 284 | `#000000` | 默认文字颜色 |
| 151 | `#000000` | 默认文字颜色 |

#### 修复建议

```scss
.text-editor {
  color: var(--mat-sys-on-surface);
}
```

---

### 6. link-style-editor.component.ts (2个)

**文件路径**：`src/app/components/project-map/drawings-editors/link-style-editor/link-style-editor.component.ts`

#### 违规详情

| 行号 | 硬编码颜色 | 用途 |
|------|-----------|------|
| 100 | `#000000` | 默认颜色 |
| 100 | `#800000` | 选中颜色 |

#### 修复建议

```scss
.link-style-editor {
  --link-default: var(--mat-sys-on-surface);
  --link-selected: var(--mat-sys-error);
}
```

---

### 7. style-editor.component.ts (1个)

**文件路径**：`src/app/components/project-map/drawings-editors/style-editor/style-editor.component.ts`

#### 违规详情

| 行号 | 硬编码颜色 | 用途 |
|------|-----------|------|
| 132, 137 | `#000000` | 默认颜色 |

---

### 8. acl-management.component.html (1个)

**文件路径**：`src/app/components/acl-management/acl-management.component.html`

#### 违规详情

| 行号 | 硬编码颜色 | 用途 |
|------|-----------|------|
| 30, 106 | `#ace` | 内联样式边框色 |

#### 修复建议

移除内联样式，使用 CSS 类：

```html
<!-- ❌ 错误 -->
<div style="border-color: #ace;">

<!-- ✅ 正确 -->
<div class="acl-rule-border">
```

```scss
.acl-rule-border {
  border-color: var(--mat-sys-outline);
}
```

---

### 9. drawing-factory 工厂类 (2个)

**文件路径**：
- `src/app/cartography/helpers/drawings-factory/ellipse-element-factory.ts`
- `src/app/cartography/helpers/drawings-factory/rectangle-element-factory.ts`

#### 违规详情

| 行号 | 硬编码颜色 | 用途 |
|------|-----------|------|
| 10 | `#ffffff` | 默认填充色 |
| 12 | `#000000` | 默认描边色 |

#### 修复建议

这些是绘图元素的默认值，应该使用 CSS 变量：

```typescript
const DEFAULT_FILL = 'var(--mat-sys-surface)';
const DEFAULT_STROKE = 'var(--mat-sys-on-surface)';
```

---

### 10. 其他 cartography 组件 (7个)

**文件路径**：
- `src/app/cartography/helpers/drawings-factory/line-element-factory.ts`
- `src/app/cartography/helpers/drawings-factory/text-element-factory.ts`
- `src/app/cartography/widgets/links/ethernet-link.ts`
- `src/app/cartography/widgets/links/serial-link.ts`
- `src/app/cartography/widgets/drawing-line.ts`
- `src/app/cartography/widgets/drawing.ts`
- `src/app/cartography/widgets/node.ts`
- `src/app/cartography/helpers/font-bbox-calculator.ts`

#### 违规详情

这些文件包含绘图元素和链接的默认颜色值（`#000000`, `#ffffff`, `#800000` 等）。

#### 修复建议

将默认颜色值定义为常量或从配置中读取：

```typescript
// drawing-defaults.ts
export const DRAWING_DEFAULTS = {
  fill: 'var(--mat-sys-surface)',
  stroke: 'var(--mat-sys-on-surface)',
  text: 'var(--mat-sys-on-surface)',
} as const;
```

---

## 🔧 修复顺序建议

### 第一批：AI Chat 组件（最高优先级）
1. ✅ `chat-input-area.component.ts` (19个)
2. ✅ `tool-call-display.component.ts` (6个)
3. ✅ `chat-session-list.component.ts` (2个)

### 第二批：编辑器组件
4. ✅ `text-editor.component.ts` (2个)
5. ✅ `link-style-editor.component.ts` (2个)
6. ✅ `style-editor.component.ts` (1个)

### 第三批：Cartography 组件
7. ✅ `interface-status.ts` (6个)
8. ✅ `drawing-factory` 类 (2个)
9. ✅ 其他 cartography 组件 (5个)

### 第四批：HTML 内联样式
10. ✅ `acl-management.component.html` (1个)

---

## 📝 修复原则

1. **所有样式必须在 `.scss` 文件中**
2. **使用 Material Design 3 CSS 变量** (`--mat-sys-*`)
3. **使用 `color-mix()` 函数创建变体**
4. **禁止在 TS 文件中定义样式字符串**
5. **禁止在 HTML 中使用内联样式**

---

## 📊 进度跟踪

| 批次 | 文件 | 违规数 | 状态 |
|------|------|--------|------|
| 1 | chat-input-area.component.ts | 19 | ⏳ 待修复 |
| 1 | tool-call-display.component.ts | 6 | ⏳ 待修复 |
| 1 | chat-session-list.component.ts | 2 | ⏳ 待修复 |
| 2 | text-editor.component.ts | 2 | ⏳ 待修复 |
| 2 | link-style-editor.component.ts | 2 | ⏳ 待修复 |
| 2 | style-editor.component.ts | 1 | ⏳ 待修复 |
| 3 | interface-status.ts | 6 | ⏳ 待修复 |
| 3 | drawing-factory 类 | 2 | ⏳ 待修复 |
| 3 | 其他 cartography 组件 | 5 | ⏳ 待修复 |
| 4 | acl-management.component.html | 1 | ⏳ 待修复 |

**总计**：40 个违规 | **已完成**：0 | **待修复**：40
