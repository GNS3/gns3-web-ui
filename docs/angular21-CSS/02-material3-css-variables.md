# Material Design 3 CSS Variables Reference

> 基于 Angular Material 21 MD3 Sass Mixin 系统
> 通过 `mat.all-component-themes()` 和 `mat.system-level-colors()` 生成

---

## 目录

1. [使用方式](#使用方式)
2. [主题配置](#主题配置)
3. [Primary 主色](#primary-主色)
4. [Secondary 次要色](#secondary-次要色)
5. [Tertiary 强调色](#tertiary-强调色)
6. [Error 错误色](#error-错误色)
7. [Surface 表面色](#surface-表面色)
8. [Surface Container 容器层级](#surface-container-容器层级)
9. [Inverse 反色](#inverse-反色)
10. [其他系统变量](#其他系统变量)
11. [Typography 排版](#typography-排版)
12. [Shape 圆角](#shape-圆角)
13. [State Layer 状态层](#state-layer-状态层)
14. [使用示例](#使用示例)

---

## 使用方式

### SCSS

```scss
.my-component {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
}
```

### HTML 内联

```html
<div [style.backgroundColor]="'var(--mat-sys-surface)'">
  <span [style.color]="'var(--mat-sys-on-surface)'">Text</span>
</div>
```

### CSS 类

```css
.custom-card {
  background: var(--mat-sys-surface-container-low);
  border: 1px solid var(--mat-sys-outline-variant);
}
```

---

## 主题配置

### 可用主题

| 类名 | 类型 | Primary | Tertiary | 适合场景 |
|------|------|---------|----------|----------|
| `theme-deeppurple-amber` | 亮色 | 紫罗兰 | 黄色 | 专业/商务 |
| `theme-indigo-pink` | 亮色 | 天蓝 | 玫瑰 | 现代/科技 |
| `theme-pink-bluegrey` | 暗色 | 玫瑰 | 蓝色 | 娱乐/创意 |
| `theme-purple-green` | 暗色 | 紫罗兰 | 绿色 | 艺术/设计 |

### 主题切换

```typescript
constructor(private themeService: ThemeService) {}

// 切换到指定主题
this.themeService.setTheme('deeppurple-amber');

// 直接操作 DOM
document.documentElement.className = 'theme-indigo-pink';
```

---

## Primary 主色

**用途**：FAB、primary buttons、active states、links、图标

| CSS 变量 | 用途 | deeppurple-amber (亮) | pink-bluegrey (暗) |
|----------|------|----------------------|-------------------|
| `--mat-sys-primary` | 主色 | `#6750A4` | `#D0BCFF` |
| `--mat-sys-on-primary` | 主色上的文字 | `#FFFFFF` | `#381E72` |
| `--mat-sys-primary-container` | 主色容器（浅背景） | `#EADDFF` | `#4F378B` |
| `--mat-sys-on-primary-container` | 容器上的文字 | `#21005D` | `#EADDFF` |
| `--mat-sys-primary-fixed` | 固定主色 | `#EADDFF` | `#D0BCFF` |
| `--mat-sys-primary-fixed-dim` | 固定主色（暗淡） | `#CBAFEF` | `#B69DF8` |
| `--mat-sys-on-primary-fixed` | 固定主色上的文字 | `#21005D` | `#381E72` |
| `--mat-sys-on-primary-fixed-variant` | 固定主色变体上的文字 | `#4F378B` | `#4F378B` |
| `--mat-sys-surface-tint` | 表面色调 | `#6750A4` | `#D0BCFF` |

---

## Secondary 次要色

**用途**：chips、filter chips、assist chips、secondary buttons

| CSS 变量 | 用途 | deeppurple-amber (亮) | pink-bluegrey (暗) |
|----------|------|----------------------|-------------------|
| `--mat-sys-secondary` | 次要色 | `#625B71` | `#CCC2DC` |
| `--mat-sys-on-secondary` | 次要色上的文字 | `#FFFFFF` | `#332D41` |
| `--mat-sys-secondary-container` | 次要色容器 | `#E8DEF8` | `#4A4458` |
| `--mat-sys-on-secondary-container` | 容器上的文字 | `#1D192B` | `#E8DEF8` |
| `--mat-sys-secondary-fixed` | 固定次要色 | `#E8DEF8` | `#CCC2DC` |
| `--mat-sys-secondary-fixed-dim` | 固定次要色（暗淡） | `#C4B8DC` | `#B8AACA` |
| `--mat-sys-on-secondary-fixed` | 固定次要色上的文字 | `#1D192B` | `#332D41` |
| `--mat-sys-on-secondary-fixed-variant` | 固定次要色变体上的文字 | `#433861` | `#4A4458` |

---

## Tertiary 强调色

**用途**：third-party chips、decorative elements、保龄球

| CSS 变量 | 用途 | deeppurple-amber (亮) | pink-bluegrey (暗) |
|----------|------|----------------------|-------------------|
| `--mat-sys-tertiary` | 强调色 | `#7D5260` | `#EFB8C8` |
| `--mat-sys-on-tertiary` | 强调色上的文字 | `#FFFFFF` | `#492532` |
| `--mat-sys-tertiary-container` | 强调色容器 | `#FFD8E4` | `#633B48` |
| `--mat-sys-on-tertiary-container` | 容器上的文字 | `#31111D` | `#FFD8E4` |
| `--mat-sys-tertiary-fixed` | 固定强调色 | `#FFD8E4` | `#EFB8C8` |
| `--mat-sys-tertiary-fixed-dim` | 固定强调色（暗淡） | `#F6B8CC` | `#D29DA8` |
| `--mat-sys-on-tertiary-fixed` | 固定强调色上的文字 | `#31111D` | `#492532` |
| `--mat-sys-on-tertiary-fixed-variant` | 固定强调色变体上的文字 | `#633B48` | `#633B48` |

---

## Error 错误色

**用途**：error states、error messages、error buttons

| CSS 变量 | 用途 | deeppurple-amber (亮) | pink-bluegrey (暗) |
|----------|------|----------------------|-------------------|
| `--mat-sys-error` | 错误色 | `#B3261E` | `#F2B8B5` |
| `--mat-sys-on-error` | 错误色上的文字 | `#FFFFFF` | `#601410` |
| `--mat-sys-error-container` | 错误容器 | `#F9DEDC` | `#8C1D18` |
| `--mat-sys-on-error-container` | 容器上的文字 | `#410E0B` | `#F9DEDC` |

---

## Surface 表面色

**用途**：页面背景、卡片、sheets、弹窗

| CSS 变量 | 用途 | deeppurple-amber (亮) | pink-bluegrey (暗) |
|----------|------|----------------------|-------------------|
| `--mat-sys-background` | 页面背景 | `#FFFBFE` | `#1C1B1F` |
| `--mat-sys-on-background` | 背景上的文字 | `#1C1B1F` | `#E6E1E5` |
| `--mat-sys-surface` | 默认表面 | `#FFFBFE` | `#1C1B1F` |
| `--mat-sys-on-surface` | 表面上的文字 | `#1C1B1F` | `#E6E1E5` |
| `--mat-sys-surface-variant` | 表面变体 | `#E7E0EC` | `#49454F` |
| `--mat-sys-on-surface-variant` | 变体表面上的文字 | `#49454F` | `#CAC4D0` |
| `--mat-sys-surface-bright` | 明亮表面 | `#FFFBFE` | `#2B2930` |
| `--mat-sys-surface-dim` | 暗淡表面 | `#DED8E1` | `#141218` |
| `--mat-sys-outline` | 边框/分割线 | `#79747E` | `#938F99` |
| `--mat-sys-outline-variant` | 浅边框 | `#CAC4D0` | `#49454F` |

---

## Surface Container 容器层级

**用途**：替代 surface 的分层容器，用于导航栏、卡片、内容区块

M3 使用细分的容器层级代替单一的 elevation。

| CSS 变量 | 用途 | deeppurple-amber (亮) | pink-bluegrey (暗) |
|----------|------|----------------------|-------------------|
| `--mat-sys-surface-container-lowest` | 最低层（纯平） | `#FFFFFF` | `#121212` |
| `--mat-sys-surface-container-low` | 低层 | `#F7F2F7` | `#1D1B1F` |
| `--mat-sys-surface-container` | 默认层 | `#F3EDF7` | `#211F26` |
| `--mat-sys-surface-container-high` | 高层 | `#ECE6F0` | `#2B2831` |
| `--mat-sys-surface-container-highest` | 最高层 | `#E6E0E9` | `#36343B` |

### 使用建议

| 层级 | 适用场景 |
|------|----------|
| Lowest | 页面背景、纯平设计 |
| Low | 底部 sheets |
| Default | 卡片、侧边导航 |
| High | 搜索栏、对话框背景 |
| Highest | Modal 背景、导航栏 |

---

## Inverse 反色

**用途**：深色表面上的浅色文字、Toast、Snackbar

| CSS 变量 | 用途 | deeppurple-amber (亮) | pink-bluegrey (暗) |
|----------|------|----------------------|-------------------|
| `--mat-sys-inverse-surface` | 反色表面 | `#313033` | `#E6E1E5` |
| `--mat-sys-inverse-on-surface` | 反色表面上的文字 | `#F4EFF4` | `#313033` |
| `--mat-sys-inverse-primary` | 反色主色 | `#D0BCFF` | `#6750A4` |

---

## 其他系统变量

| CSS 变量 | 用途 | deeppurple-amber (亮) | pink-bluegrey (暗) |
|----------|------|----------------------|-------------------|
| `--mat-sys-shadow` | 阴影颜色 | `#000000` | `#000000` |
| `--mat-sys-scrim` | 遮罩颜色 | `#000000` | `#000000` |

---

## Typography 排版

**用途**：定义字体大小、行高、字间距

| CSS 变量 | 用途 | 示例值 (亮色) |
|----------|------|---------------|
| `--mat-sys-display-large` | Display Large | 57sp / 64 line / -0.25 letter |
| `--mat-sys-display-medium` | Display Medium | 45sp / 52 line |
| `--mat-sys-display-small` | Display Small | 36sp / 44 line |
| `--mat-sys-headline-large` | Headline Large | 32sp / 40 line |
| `--mat-sys-headline-medium` | Headline Medium | 28sp / 36 line |
| `--mat-sys-headline-small` | Headline Small | 24sp / 32 line |
| `--mat-sys-title-large` | Title Large | 22sp / 28 line |
| `--mat-sys-title-medium` | Title Medium | 16sp / 24 line / 0.15 letter |
| `--mat-sys-title-small` | Title Small | 14sp / 20 line / 0.1 letter |
| `--mat-sys-body-large` | Body Large | 16sp / 24 line / 0.5 letter |
| `--mat-sys-body-medium` | Body Medium | 14sp / 20 line / 0.25 letter |
| `--mat-sys-body-small` | Body Small | 12sp / 16 line / 0.4 letter |
| `--mat-sys-label-large` | Label Large | 14sp / 20 line / 0.1 letter |
| `--mat-sys-label-medium` | Label Medium | 12sp / 16 line / 0.5 letter |
| `--mat-sys-label-small` | Label Small | 11sp / 16 line / 0.5 letter |

---

## Shape 圆角

**用途**：定义组件的圆角大小

| CSS 变量 | 用途 | 示例值 |
|----------|------|--------|
| `--mat-sys-corner-none` | 无圆角 | `0px` |
| `--mat-sys-corner-extra-small` | 超小圆角 | `4px` |
| `--mat-sys-corner-small` | 小圆角 | `8px` |
| `--mat-sys-corner-medium` | 中等圆角 | `12px` |
| `--mat-sys-corner-large` | 大圆角 | `16px` |
| `--mat-sys-corner-extra-large` | 超大圆角 | `28px` |
| `--mat-sys-corner-full` | 完全圆角 | `50%` |

### 使用建议

| 变量 | 适用组件 |
|------|----------|
| None | Dividers、strokes |
| Extra Small | Chips、small badges |
| Small | Small buttons、text fields |
| Medium | Cards、Chips (suggested) |
| Large | FAB、extended FAB、cards (suggested) |
| Extra Large | Modal sheets、dialogs |
| Full | FAB (non-extended)、circular buttons |

---

## State Layer 状态层

**用途**：hover、focus、pressed、dragged 状态的透明度

| CSS 变量 | 用途 | 值范围 |
|----------|------|--------|
| `--mat-sys-state-opacity-hover` | 悬停透明度 | `0.08` |
| `--mat-sys-state-opacity-focus` | 聚焦透明度 | `0.12` |
| `--mat-sys-state-opacity-pressed` | 按下透明度 | `0.12` |
| `--mat-sys-state-opacity-dragged` | 拖拽透明度 | `0.16` |

### 使用方式

```scss
.button {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: var(--mat-sys-primary);
    opacity: 0;
    transition: opacity 150ms ease;
  }

  &:hover::before {
    opacity: var(--mat-sys-state-opacity-hover);
  }

  &:focus::before {
    opacity: var(--mat-sys-state-opacity-focus);
  }

  &:active::before {
    opacity: var(--mat-sys-state-opacity-pressed);
  }
}
```

---

## 使用示例

### 按钮

```scss
.primary-button {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
  border-radius: var(--mat-sys-corner-full);
  padding: 0 24px;
  height: 40px;

  &:hover {
    background-color: var(--mat-sys-primary-container);
    color: var(--mat-sys-on-primary-container);
  }
}

.outlined-button {
  background-color: transparent;
  color: var(--mat-sys-primary);
  border: 1px solid var(--mat-sys-outline);
  border-radius: var(--mat-sys-corner-full);

  &:hover {
    background-color: var(--mat-sys-primary-container);
  }
}
```

### 卡片

```scss
.card {
  background-color: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
  border-radius: var(--mat-sys-corner-large);
  padding: 16px;
  box-shadow: 0 2px 8px var(--mat-sys-shadow);
}

.card-elevated {
  background-color: var(--mat-sys-surface-container);
  box-shadow: 0 4px 16px var(--mat-sys-shadow);
}
```

### 导航栏

```scss
.navbar {
  background-color: var(--mat-sys-surface-container);
  border-bottom: 1px solid var(--mat-sys-outline-variant);
  height: 64px;
}
```

### 输入框

```scss
.input-field {
  background-color: var(--mat-sys-surface-container-high);
  color: var(--mat-sys-on-surface);
  border: 1px solid var(--mat-sys-outline);
  border-radius: var(--mat-sys-corner-medium);
  padding: 0 16px;
  height: 56px;

  &:focus {
    border-color: var(--mat-sys-primary);
    outline: 2px solid var(--mat-sys-primary);
  }

  &::placeholder {
    color: var(--mat-sys-on-surface-variant);
  }
}
```

### 错误状态

```scss
.error-text {
  color: var(--mat-sys-error);
  font-size: var(--mat-sys-label-medium);
}

.error-container {
  background-color: var(--mat-sys-error-container);
  color: var(--mat-sys-on-error-container);
  border-radius: var(--mat-sys-corner-small);
  padding: 12px 16px;
}
```

### 对话框

```scss
.dialog {
  background-color: var(--mat-sys-surface-container-high);
  color: var(--mat-sys-on-surface);
  border-radius: var(--mat-sys-corner-extra-large);
  padding: 24px;
}

.dialog-title {
  font-size: var(--mat-sys-title-large);
  color: var(--mat-sys-on-surface);
  margin-bottom: 16px;
}
```

---

## 完整变量索引（按前缀）

### --mat-sys-color (颜色)

```
Primary:        primary, on-primary, primary-container, on-primary-container,
                primary-fixed, primary-fixed-dim, on-primary-fixed, on-primary-fixed-variant,
                surface-tint
Secondary:      secondary, on-secondary, secondary-container, on-secondary-container,
                secondary-fixed, secondary-fixed-dim, on-secondary-fixed, on-secondary-fixed-variant
Tertiary:       tertiary, on-tertiary, tertiary-container, on-tertiary-container,
                tertiary-fixed, tertiary-fixed-dim, on-tertiary-fixed, on-tertiary-fixed-variant
Error:          error, on-error, error-container, on-error-container
Surface:        background, on-background, surface, on-surface, surface-variant, on-surface-variant,
                surface-bright, surface-dim, surface-tint
Outline:        outline, outline-variant
Container:      surface-container-lowest, surface-container-low, surface-container,
                surface-container-high, surface-container-highest
Inverse:        inverse-surface, inverse-on-surface, inverse-primary
Other:          shadow, scrim
```

### --mat-sys-typography (排版)

```
display-large, display-medium, display-small,
headline-large, headline-medium, headline-small,
title-large, title-medium, title-small,
body-large, body-medium, body-small,
label-large, label-medium, label-small
```

### --mat-sys-corner (圆角)

```
corner-none, corner-extra-small, corner-small, corner-medium,
corner-large, corner-extra-large, corner-full
```

### --mat-sys-state (状态)

```
state-opacity-hover, state-opacity-focus, state-opacity-pressed, state-opacity-dragged
```
