# Angular Material 主题迁移技术实施指南

## 快速参考

### 常用 CSS 变量对照表

| 旧值（硬编码） | 新值（CSS 变量） | 说明 |
|---------------|----------------|------|
| `#0097a7` | `var(--mat-app-primary-color)` | GNS3 主色 |
| `#20313b` | `var(--mat-app-background-color)` | 深色背景 |
| `#e8ecef` | `var(--mat-app-surface-color)` | 浅色背景 |
| `rgba(255,255,255,0.87)` | `var(--mat-app-on-surface-variant-color)` | 文本颜色 |
| `0 4px 8px rgba(0,0,0,0.2)` | `var(--mdc-elevated-card-container-elevation)` | 阴影 |
| `12px` | `var(--gns3-spacing-md)` | 中等间距 |
| `8px` | `var(--gns3-spacing-sm)` | 小间距 |

---

## 第一阶段：创建新主题系统

### 步骤 1: 创建新主题文件

**文件**: `src/styles/theme-v2.scss`

```scss
@use '@angular/material' as mat;
@use '@angular/material/core' as mat-core;

// =============================================
// 1. 定义 GNS3 主题
// =============================================

// 深色主题（默认）
$gns3-dark-theme: mat.define-theme((
  color: (
    theme-type: dark,
    primary: mat.$cyan-palette,
    tertiary: mat.$blue-grey-palette,
    primary-tone: 700,  // GNS3 cyan #0097a7
  ),
  density: 0,
  typography: (
    brand-family: 'Roboto',
    bold-weight: 500,
    medium-weight: 400,
    regular-weight: 400,
  ),
));

// 浅色主题
$gns3-light-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$cyan-palette,
    tertiary: mat.$blue-grey-palette,
    primary-tone: 700,
  ),
  density: 0,
  typography: (
    brand-family: 'Roboto',
    bold-weight: 500,
  ),
));

// =============================================
// 2. 应用主题
// =============================================

// 默认深色主题
:root {
  @include mat.all-component-themes($gns3-dark-theme);

  // =============================================
  // 3. GNS3 自定义 Design Tokens
  // =============================================

  // 品牌颜色
  --gns3-cyan: #0097a7;
  --gns3-cyan-light: #00bcd4;
  --gns3-dark-bg: #20313b;
  --gns3-light-bg: #e8ecef;

  // 间距系统（4px 基础单位）
  --gns3-spacing-xs: 4px;
  --gns3-spacing-sm: 8px;
  --gns3-spacing-md: 12px;
  --gns3-spacing-lg: 16px;
  --gns3-spacing-xl: 24px;
  --gns3-spacing-2xl: 32px;

  // 圆角系统
  --gns3-radius-sm: 4px;
  --gns3-radius-md: 8px;
  --gns3-radius-lg: 12px;
  --gns3-radius-xl: 16px;
  --gns3-radius-full: 9999px;

  // 布局尺寸
  --gns3-toolbar-height: 60px;
  --gns3-toolbar-padding: 20px;
  --gns3-sidebar-width: 280px;
  --gns3-header-height: 48px;

  // Z-index 层级
  --gns3-z-dropdown: 1000;
  --gns3-z-sticky: 1020;
  --gns3-z-fixed: 1030;
  --gns3-z-modal-backdrop: 1040;
  --gns3-z-modal: 1050;
  --gns3-z-popover: 1060;
  --gns3-z-tooltip: 1070;
}

// 浅色主题覆盖
.theme-light {
  @include mat.all-component-themes($gns3-light-theme);

  // 覆盖自定义颜色
  --gns3-dark-bg: #ffffff;
  --gns3-light-bg: #f5f5f5;
}

// =============================================
// 4. 全局样式覆盖
// =============================================

// 滚动条样式
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--mat-app-background-color);
}

::-webkit-scrollbar-thumb {
  background: var(--mat-app-outline-variant-color);
  border-radius: 4px;

  &:hover {
    background: var(--mat-app-primary-color);
  }
}

// Markdown 内容样式
markdown {
  color: var(--mat-app-text-color);

  h1, h2, h3, h4, h5, h6 {
    color: var(--mat-app-on-surface-color);
  }

  code {
    background-color: var(--mat-app-surface-variant-color);
    color: var(--mat-app-text-color);
  }

  a {
    color: var(--mat-app-primary-color);
  }
}
```

### 步骤 2: 更新 angular.json

```json
{
  "projects": {
    "gns3-web-ui": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/@angular/material/prebuilt-themes/indigo-pink.css",
              "src/theme.scss",           // 保留旧主题（向后兼容）
              "src/styles/theme-v2.scss", // 新主题
              "src/styles.scss"
            ],
            "stylePreprocessorOptions": {
              "includePaths": [
                "src/styles"
              ]
            }
          }
        }
      }
    }
  }
}
```

### 步骤 3: 更新 ThemeService

**文件**: `src/app/services/theme.service.ts`

```typescript
import { Injectable, Inject, InjectionToken } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export const THEME_TOKEN = new InjectionToken<'light' | 'dark'>('THEME_TOKEN', {
  providedIn: 'root',
  factory: () => 'dark' as const
});

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme: 'light' | 'dark' = 'dark';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(THEME_TOKEN) defaultTheme: 'light' | 'dark'
  ) {
    this.currentTheme = defaultTheme;
    this.applyTheme(defaultTheme);
  }

  /**
   * 获取当前主题
   */
  getTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * 设置主题
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.currentTheme = theme;
    this.applyTheme(theme);

    // 保存到 localStorage
    localStorage.setItem('theme-preference', theme);
  }

  /**
   * 切换主题
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * 应用主题到 DOM
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    const htmlElement = this.document.documentElement;

    // 移除旧主题类
    htmlElement.classList.remove('theme-light', 'theme-dark');

    // 添加新主题类
    htmlElement.classList.add(`theme-${theme}`);

    // 更新 body 背景
    if (theme === 'dark') {
      htmlElement.style.setProperty('--gns3-bg-color', '#20313b');
      this.document.body.style.backgroundColor = '#20313b';
    } else {
      htmlElement.style.setProperty('--gns3-bg-color', '#e8ecef');
      this.document.body.style.backgroundColor = '#e8ecef';
    }
  }

  /**
   * 从 localStorage 恢复主题
   */
  restoreTheme(): void {
    const savedTheme = localStorage.getItem('theme-preference') as 'light' | 'dark' | null;
    if (savedTheme) {
      this.setTheme(savedTheme);
    }
  }

  /**
   * 获取实际主题（考虑系统偏好）
   */
  getActualTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * 获取地图主题
   */
  getActualMapTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }
}
```

---

## 第二阶段：迁移 AI Chat 组件

### 步骤 1: 更新 AI Chat 主样式

**文件**: `src/app/components/project-map/ai-chat/ai-chat.component.scss`

```scss
// =============================================
// 导入 Material Design Tokens
// =============================================
@use '@angular/material' as mat;

// =============================================
// 移除旧的 CSS 变量定义（已在 theme-v2.scss 中定义）
// =============================================

// =============================================
// AI Chat 容器
// =============================================
.ai-chat-container {
  position: fixed;
  background-color: var(--mat-app-surface-container-low-color);
  border-radius: var(--gns3-radius-lg);
  overflow: hidden;
  display: flex;
  z-index: var(--gns3-z-dropdown);
  color: var(--mat-app-on-surface-color);
  border: 1px solid var(--mat-app-outline-variant-color);

  // 性能优化：完全透明，无 backdrop-filter
  transition: box-shadow var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing),
              border-color var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);

  // GNS3 青色渐变边框效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: var(--gns3-radius-lg);
    padding: 1px;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--mat-app-primary-color) 40%, transparent),
      color-mix(in srgb, var(--mat-app-primary-color) 20%, transparent),
      color-mix(in srgb, var(--mat-app-primary-color) 40%, transparent)
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.8;
    transition: opacity var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
  }

  &:hover::before {
    opacity: 1;
  }

  // 最小化状态
  &.minimized {
    border-radius: 50%;
    border: none;
    box-shadow: var(--mdc-elevated-card-container-elevation);

    &::before {
      display: none;
    }
  }
}

// =============================================
// 侧边栏
// =============================================
.chat-sidebar {
  width: var(--gns3-sidebar-width);
  background-color: var(--mat-app-surface-container-low-color);
  display: flex;
  flex-direction: column;
  transition: width var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
  flex-shrink: 0;
}

.chat-sidebar.collapsed {
  width: 48px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gns3-spacing-md);
  cursor: grab;
  user-select: none;
  height: var(--gns3-header-height);
  box-sizing: border-box;
}

.sidebar-header:active {
  cursor: grabbing;
}

// =============================================
// 新聊天按钮（折叠状态）
// =============================================
.collapsed-new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--gns3-header-height);
  background: transparent;
  border-radius: 0;
  transition: all var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
  margin: var(--gns3-spacing-sm) 0;

  mat-icon {
    font-size: 24px;
    width: 24px;
    height: 24px;
    color: var(--mat-app-primary-color);
    transition: all var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
  }

  &:hover {
    mat-icon {
      transform: scale(1.2);
      filter: drop-shadow(0 0 6px color-mix(in srgb, var(--mat-app-primary-color) / 0.6, transparent));
    }
  }

  &:active {
    mat-icon {
      transform: scale(0.95);
    }
  }
}

.chat-sidebar.collapsed .collapsed-new-chat-btn {
  display: flex;
}

.chat-sidebar:not(.collapsed) .collapsed-new-chat-btn {
  display: none;
}

// =============================================
// 侧边栏标题
// =============================================
.sidebar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--mat-app-on-surface-color);
  display: flex;
  align-items: center;
  gap: var(--gns3-spacing-sm);
  width: 100%;
  justify-content: center;
}

.sidebar-title.clickable {
  cursor: pointer;
  transition: all var(--mat-standard-motion-duration-short) var(--mat-standard-motion-easing);
}

.sidebar-title.clickable:hover {
  opacity: 0.9;
}

.sidebar-title.clickable:active {
  opacity: 0.8;
}

// =============================================
// AI Logo
// =============================================
.ai-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  font-family: 'Roboto', sans-serif;
  letter-spacing: -0.5px;
  background: linear-gradient(
    135deg,
    var(--mat-app-primary-color),
    var(--mat-app-primary-color)
  );
  color: var(--mat-app-on-primary-color);
  padding: 6px 10px;
  border-radius: var(--gns3-radius-sm);
  transition: all var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
  flex-shrink: 0;
  box-shadow: var(--mdc-elevated-card-container-elevation);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      color-mix(in srgb, var(--mat-app-on-primary-color) / 0.1, transparent) 50%,
      transparent 70%
    );
    transform: translateX(-100%);
    transition: transform var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
  }
}

.sidebar-title.clickable:hover .ai-logo {
  transform: scale(1.08);
  box-shadow: 0 4px 15px color-mix(in srgb, var(--mat-app-primary-color) / 0.5, transparent);

  &::after {
    transform: translateX(100%);
  }
}

.sidebar-title.clickable:active .ai-logo {
  transform: scale(0.95);
}

// =============================================
// 主聊天区域
// =============================================
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--mat-app-surface-container-low-color);
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gns3-spacing-md);
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
  transition: background var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
  position: relative;
  height: var(--gns3-header-height);
  box-sizing: border-box;
}

.chat-header:active {
  cursor: grabbing;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: var(--gns3-spacing-sm);
  font-size: 16px;
  font-weight: 500;
  color: var(--mat-app-on-surface-color);
}

.chat-messages {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.chat-input {
  border-top: 1px solid var(--mat-app-outline-variant-color);
  flex-shrink: 0;
  position: relative;
  transition: border-color var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);

  &:focus-within {
    border-top-color: var(--mat-app-primary-color);
    box-shadow: 0 -2px 10px color-mix(in srgb, var(--mat-app-primary-color) / 0.2, transparent);
  }
}

// =============================================
// Header 操作按钮
// =============================================
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--gns3-spacing-xs);

  .mat-icon-button {
    color: var(--mat-app-on-surface-color);
    transition: all var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: color-mix(in srgb, var(--mat-app-primary-color) / 0.3, transparent);
      transform: translate(-50%, -50%);
      transition: width var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing),
                  height var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
    }
  }

  .header-icon {
    fill: var(--mat-app-on-surface-color);
    transition: all var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
    width: 20px;
    height: 20px;
    position: relative;
    z-index: 1;
  }

  .mat-icon-button:hover {
    background-color: color-mix(in srgb, var(--mat-app-primary-color) / 0.15, transparent);
    border-radius: 50%;
    transform: scale(1.15);
    box-shadow: var(--mdc-elevated-card-container-elevation);

    &::before {
      width: 100%;
      height: 100%;
    }

    .header-icon {
      fill: var(--mat-app-primary-color);
      filter: drop-shadow(0 0 6px color-mix(in srgb, var(--mat-app-primary-color) / 0.8, transparent));
    }
  }

  .mat-icon-button:active {
    transform: scale(0.95);
  }

  .close-button:hover {
    background-color: color-mix(in srgb, #f44336 / 0.2, transparent);
    box-shadow: 0 0 10px color-mix(in srgb, #f44336 / 0.4, transparent);

    .header-icon {
      fill: #ff8a80;
    }
  }
}

// =============================================
// 最小化状态按钮
// =============================================
.minimized-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
  user-select: none;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--mat-app-background-color),
    var(--mat-app-surface-color)
  );
  box-shadow: var(--mdc-elevated-card-container-elevation);
  transition: all var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
  animation: bounceIn var(--mat-standard-motion-duration-long) var(--mat-standard-motion-easing);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--mat-app-primary-color) / 0.3, transparent) 0%,
      transparent 70%
    );
    animation: pulse 2s ease-in-out infinite;
  }

  &:hover {
    transform: scale(1.15);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--mat-app-background-color) / 0.6, transparent),
                0 0 30px color-mix(in srgb, var(--mat-app-primary-color) / 0.5, transparent);

    &::before {
      background: radial-gradient(
        circle,
        color-mix(in srgb, var(--mat-app-primary-color) / 0.5, transparent) 0%,
        transparent 70%
      );
    }
  }

  &:active {
    transform: scale(1.05);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.minimized-icon {
  font-size: 28px;
  width: 28px;
  height: 28px;
  color: var(--mat-app-outline-color);
  position: relative;
  z-index: 1;
}

// =============================================
// 最大化状态
// =============================================
.ai-chat-container.maximized {
  border-radius: 0;

  .chat-sidebar {
    height: 100vh;
  }

  .chat-header {
    cursor: default;
  }

  .sidebar-header,
  .collapsed-hint {
    cursor: default;
  }
}

// =============================================
// 响应式设计
// =============================================
@media (max-width: 768px) {
  .chat-sidebar {
    position: absolute;
    z-index: var(--gns3-z-sticky);
    height: 100%;
  }

  .chat-sidebar.collapsed {
    width: 0;
  }
}

// =============================================
// Snackbar 错误样式
// =============================================
::ng-deep .ai-chat-snack-error {
  background-color: var(--mat-app-error-color);
  color: var(--mat-app-on-error-color);
  font-weight: 500;

  .mat-simple-snackbar-action {
    color: var(--mat-app-on-error-color);
    font-weight: 600;
  }
}
```

### 步骤 2: 更新其他 AI Chat 子组件

#### Chat Message List

**文件**: `src/app/components/project-map/ai-chat/chat-message-list.component.scss`

```scss
@use '@angular/material' as mat;

.chat-message-list {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--mat-app-background-color);

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--mat-app-primary-color) / 0.4, transparent);
    border-radius: 3px;

    &:hover {
      background: color-mix(in srgb, var(--mat-app-primary-color) / 0.6, transparent);
    }
  }

  &.auto-scroll {
    scroll-behavior: smooth;
  }
}

.messages-container {
  padding: var(--gns3-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--gns3-spacing-md);
}

// 消息样式
.message {
  display: flex;
  gap: var(--gns3-spacing-sm);
  max-width: 80%;

  &.user-message {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  &.assistant-message {
    align-self: flex-start;
  }

  &.system-message {
    align-self: center;
    max-width: 90%;
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar {
  background-color: var(--mat-app-primary-color);
  color: var(--mat-app-on-primary-color);
}

.assistant-avatar {
  background-color: var(--mat-app-surface-variant-color);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: var(--gns3-spacing-xs);
}

.message-bubble {
  padding: var(--gns3-spacing-sm) var(--gns3-spacing-md);
  border-radius: var(--gns3-radius-lg);
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;

  &.user-bubble {
    background-color: var(--mat-app-primary-color);
    color: var(--mat-app-on-primary-color);
    border-bottom-right-radius: var(--gns3-radius-xs);
  }

  &.assistant-bubble {
    background-color: var(--mat-app-surface-container-low-color);
    color: var(--mat-app-on-surface-color);
    border-bottom-left-radius: var(--gns3-radius-xs);

    &.streaming {
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: var(--gns3-spacing-sm);
        right: var(--gns3-spacing-sm);
        width: 8px;
        height: 8px;
        background-color: var(--mat-app-primary-color);
        border-radius: 50%;
        animation: blink 1.5s infinite;
      }
    }
  }

  &.system-bubble {
    background-color: var(--mat-app-surface-variant-color);
    color: var(--mat-app-on-surface-variant-color);
    text-align: center;
    padding: var(--gns3-spacing-xs) var(--gns3-spacing-sm);
    font-size: 12px;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.message-text {
  margin: 0;
  line-height: 1.5;

  // Markdown 样式
  h1, h2, h3, h4, h5, h6 {
    margin-top: var(--gns3-spacing-sm);
    margin-bottom: var(--gns3-spacing-xs);
  }

  p {
    margin: var(--gns3-spacing-xs) 0;
  }

  code {
    background-color: var(--mat-app-surface-variant-color);
    padding: 2px 6px;
    border-radius: var(--gns3-radius-xs);
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  pre {
    background-color: var(--mat-app-surface-variant-color);
    padding: var(--gns3-spacing-sm);
    border-radius: var(--gns3-radius-md);
    overflow-x: auto;

    code {
      background-color: transparent;
      padding: 0;
    }
  }
}

.message-time {
  font-size: 11px;
  color: var(--mat-app-on-surface-variant-color);
  opacity: 0.7;
  margin-top: var(--gns3-spacing-xs);
}

// 空状态
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--gns3-spacing-xl);
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon-wrapper {
  margin-bottom: var(--gns3-spacing-lg);
}

.empty-icon {
  font-size: 64px;
  width: 64px;
  height: 64px;
  color: var(--mat-app-primary-color);
  opacity: 0.5;
}

.empty-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--mat-app-on-surface-color);
  margin-bottom: var(--gns3-spacing-sm);
}

.empty-description {
  font-size: 14px;
  color: var(--mat-app-on-surface-variant-color);
  margin-bottom: var(--gns3-spacing-lg);
}

.empty-suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--gns3-spacing-sm);
}

.suggestion-chip {
  display: flex;
  align-items: center;
  gap: var(--gns3-spacing-sm);
  padding: var(--gns3-spacing-sm) var(--gns3-spacing-md);
  background-color: var(--mat-app-surface-container-low-color);
  border: 1px solid var(--mat-app-outline-variant-color);
  border-radius: var(--gns3-radius-md);
  cursor: pointer;
  transition: all var(--mat-standard-motion-duration-short) var(--mat-standard-motion-easing);

  &:hover {
    background-color: var(--mat-app-primary-color);
    color: var(--mat-app-on-primary-color);
    border-color: var(--mat-app-primary-color);
    transform: translateY(-1px);
    box-shadow: var(--mdc-elevated-card-container-elevation);
  }

  &:active {
    transform: translateY(0);
  }

  mat-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
  }

  span {
    font-size: 14px;
  }
}

// Tool calls 和 Tool results
.tool-calls-container,
.tool-results-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gns3-spacing-xs);
  margin-top: var(--gns3-spacing-xs);
}

.inline-tool-call,
.inline-tool-result {
  display: inline-flex;
  align-items: center;
  gap: var(--gns3-spacing-xs);
  padding: 4px var(--gns3-spacing-sm);
  background-color: var(--mat-app-surface-container-low-color);
  border: 1px solid var(--mat-app-outline-variant-color);
  border-radius: var(--gns3-radius-sm);
  cursor: pointer;
  font-size: 12px;
  transition: all var(--mat-standard-motion-duration-short) var(--mat-standard-motion-easing);

  &:hover {
    background-color: var(--mat-app-primary-color);
    color: var(--mat-app-on-primary-color);
    border-color: var(--mat-app-primary-color);
  }

  mat-icon {
    font-size: 14px;
    width: 14px;
    height: 14px;
  }

  .tool-name-text {
    font-weight: 500;
  }
}

.inline-tool-call {
  .tool-icon {
    color: var(--mat-app-primary-color);
  }
}

.inline-tool-result {
  .tool-icon {
    color: var(--mat-app-primary-color);
  }
}
```

---

## 第三阶段：验证和测试

### 单元测试示例

**文件**: `src/app/services/theme.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: DOCUMENT, useValue: document }
      ]
    });

    service = TestBed.inject(ThemeService);
    document = TestBed.inject(DOCUMENT);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set dark theme by default', () => {
    expect(service.getTheme()).toBe('dark');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });

  it('should switch to light theme', () => {
    service.setTheme('light');

    expect(service.getTheme()).toBe('light');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
  });

  it('should toggle theme', () => {
    service.toggleTheme();

    expect(service.getTheme()).toBe('light');

    service.toggleTheme();

    expect(service.getTheme()).toBe('dark');
  });

  it('should save theme to localStorage', () => {
    service.setTheme('light');

    expect(localStorage.getItem('theme-preference')).toBe('light');
  });

  it('should restore theme from localStorage', () => {
    localStorage.setItem('theme-preference', 'light');

    service.restoreTheme();

    expect(service.getTheme()).toBe('light');
  });
});
```

### E2E 测试示例

**文件**: `src/app/components/project-map/ai-chat/ai-chat.e2e-spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('AI Chat Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/project/test-project');
  });

  test('should have dark theme by default', async ({ page }) => {
    const aiChatContainer = page.locator('.ai-chat-container');

    const backgroundColor = await aiChatContainer.evaluate(
      el => getComputedStyle(el).backgroundColor
    );

    expect(backgroundColor).toBe('rgb(32, 49, 59)'); // #20313b
  });

  test('should switch to light theme', async ({ page }) => {
    // 点击主题切换按钮
    await page.locator('[data-test="theme-toggle"]').click();

    const aiChatContainer = page.locator('.ai-chat-container');

    const backgroundColor = await aiChatContainer.evaluate(
      el => getComputedStyle(el).backgroundColor
    );

    expect(backgroundColor).toBe('rgb(232, 236, 239)'); // #e8ecef
  });

  test('should persist theme preference', async ({ page }) => {
    // 切换到浅色主题
    await page.locator('[data-test="theme-toggle"]').click();

    // 刷新页面
    await page.reload();

    // 验证主题保持为浅色
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/theme-light/);
  });

  test('should apply CSS variables correctly', async ({ page }) => {
    const htmlElement = page.locator('html');

    const primaryColor = await htmlElement.evaluate(
      el => getComputedStyle(el).getPropertyValue('--mat-app-primary-color')
    );

    expect(primaryColor).toBeTruthy();
    expect(primaryColor).toContain('#0097a7');
  });
});
```

---

## 常见问题解答

### Q1: 如何调试 CSS 变量？

```javascript
// 在浏览器控制台中运行
const root = document.documentElement;
const styles = getComputedStyle(root);

// 查看所有 Material CSS 变量
for (let i = 0; i < styles.length; i++) {
  const prop = styles[i];
  if (prop.startsWith('--mat-') || prop.startsWith('--mdc-')) {
    console.log(`${prop}: ${styles.getPropertyValue(prop)}`);
  }
}
```

### Q2: 如何覆盖特定组件的样式？

```scss
// 使用 Material 的 override mixin
@use '@angular/material' as mat;

.my-custom-button {
  @include mat.button-overrides((
    foreground-color: var(--mat-app-primary-color),
    background-color: var(--mat-app-surface-color),
  ));
}
```

### Q3: 如何处理第三方组件样式？

```scss
// 为第三方组件提供特定样式
::ng-deep .third-party-component {
  color: var(--mat-app-text-color);
  background-color: var(--mat-app-surface-color);

  // 覆盖内部样式
  .inner-element {
    border-color: var(--mat-app-outline-variant-color);
  }
}
```

### Q4: 如何处理 D3.js 图表的样式？

```scss
// D3 图表使用 CSS 变量
svg.map {
  g.node:hover {
    fill: var(--mat-app-primary-color);
    stroke: var(--mat-app-on-primary-color);
  }

  path.ethernet_link {
    stroke: var(--mat-app-outline-color);

    &:hover {
      stroke: var(--mat-app-error-color);
    }
  }

  text.label {
    fill: var(--mat-app-on-surface-color);
  }
}
```

---

**文档版本**: v1.0
**创建时间**: 2026-03-20
**最后更新**: 2026-03-20
