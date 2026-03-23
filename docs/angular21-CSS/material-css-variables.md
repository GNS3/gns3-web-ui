# Angular Material CSS 颜色变量完整参考

> 基于 Angular Material 21 预构建主题的分析
>
> 分析文件: `pink-bluegrey.css`
>
> 生成时间: 2026-03-23

## 📊 总体统计

| 类别 | 数量 |
|------|------|
| **总 CSS 变量** | 946 个 |
| **颜色相关变量** | 401 个 |
| **组件/模块数量** | 37 个 |
| **系统级令牌** | 4 个 |

---

## 🎨 变量命名规范

Angular Material CSS 变量遵循以下命名规范：

```
--mat-{level}-{component}-{property}-{variant}-{state}-{element}
```

### 命名层级说明

| 层级 | 说明 | 示例 |
|------|------|------|
| `level` | 变量级别 | `app`, `sys` |
| `component` | 组件名称 | `button`, `card`, `dialog` |
| `property` | 属性类型 | `container`, `label`, `icon` |
| `variant` | 变体 | `filled`, `outlined`, `elevated` |
| `state` | 状态 | `disabled`, `hover`, `focus`, `pressed` |
| `element` | 子元素 | `text`, `background`, `outline` |

### 示例解析

```
--mat-button-filled-disabled-label-text-color
  │     │       │      │         │     └─ 元素：文本颜色
  │     │       │      │         └─────── 状态：禁用
  │     │       │      └────────────────── 属性：标签
  │     │       └───────────────────────── 变体：实心按钮
  │     └───────────────────────────────── 组件：按钮
  └─────────────────────────────────────── 级别：Material
```

---

## 🔧 系统级设计令牌 (System Tokens)

这些是 Material Design 3 的核心设计令牌，所有组件都基于这些令牌构建。

| 变量 | 用途 | 说明 |
|------|------|------|
| `--mat-sys-background` | 背景色 | 应用的主背景颜色 |
| `--mat-sys-on-background` | 背景文本色 | 背景上的文本颜色 |
| `--mat-sys-on-surface` | 表面文本色 | 表面上的文本颜色 |
| `--mat-sys-shadow` | 阴影色 | 用于 elevation 效果的阴影颜色 |

### 使用示例

```css
.custom-element {
  background-color: var(--mat-sys-background);
  color: var(--mat-sys-on-background);
  box-shadow: 0 2px 4px var(--mat-sys-shadow);
}
```

---

## 📦 应用级变量 (App-level Variables)

这些变量为整个应用提供默认值。

| 变量 | 用途 | 默认值来源 |
|------|------|-----------|
| `--mat-app-background-color` | 应用背景色 | `--mat-sys-background` |
| `--mat-app-text-color` | 应用文本色 | `--mat-sys-on-background` |
| `--mat-app-elevation-shadow-level-0` 至 `level-8` | 阴影级别 | 0-8 级阴影 |

### 阴影级别说明

| 级别 | 使用场景 |
|------|----------|
| Level 0 | 无阴影（平面） |
| Level 1-2 | 卡片、按钮默认状态 |
| Level 3-4 | 下拉菜单、对话框 |
| Level 5-8 | 模态对话框、抽屉等高层级元素 |

---

## 🧩 组件级颜色变量

### 按变量数量排序的组件列表

| 排名 | 组件 | 变量数量 | 主要用途 |
|------|------|----------|----------|
| 1 | `form` | 55 | 表单字段输入 |
| 2 | `button` | 50 | 按钮组件 |
| 3 | `slide` | 36 | 滑动开关 |
| 4 | `datepicker` | 29 | 日期选择器 |
| 5 | `chip` | 23 | 芯片标签 |
| 6 | `list` | 20 | 列表项 |
| 7 | `checkbox` | 19 | 复选框 |
| 8 | `stepper` | 18 | 步骤条 |
| 9 | `slider` | 17 | 滑块 |
| 10 | `tab` | 16 | 标签页 |
| 11 | `fab` | 14 | 浮动操作按钮 |
| 12 | `radio` | 14 | 单选按钮 |
| 13 | `expansion` | 9 | 展开面板 |
| 14 | `pseudo` | 8 | 伪复选框 |
| 15 | `select` | 8 | 下拉选择 |

---

## 📝 详细组件变量表

### 1. FORM - 表单字段 (55 个变量)

表单字段用于文本输入、选择等场景，支持多种外观样式。

| 变量名 | 属性 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-form-field-filled-container-color` | container | filled | 实心样式容器背景 |
| `--mat-form-field-filled-label-text-color` | label | filled | 实心样式标签文本 |
| `--mat-form-field-filled-input-text-color` | input | filled | 实心样式输入文本 |
| `--mat-form-field-filled-disabled-container-color` | container | filled, disabled | 实心禁用容器 |
| `--mat-form-field-filled-error-label-text-color` | label | filled, error | 实心错误标签 |
| `--mat-form-field-outlined-container-color` | container | outlined | 轮廓样式容器 |
| `--mat-form-field-outlined-label-text-color` | label | outlined | 轮廓样式标签 |
| `--mat-form-field-disabled-input-text-color` | input | disabled | 禁用输入文本 |
| `--mat-form-field-error-text-color` | text | error | 错误提示文本 |
| `--mat-form-field-error-focus-trailing-icon-color` | icon | error, focus | 错误聚焦尾图标 |

**外观变体：**
- `filled`: 实心背景样式
- `outlined`: 轮廓边框样式
- `solo`: 独立样式

**状态：**
- `enabled`: 启用
- `disabled`: 禁用
- `error`: 错误
- `focus`: 聚焦

---

### 2. BUTTON - 按钮 (50 个变量)

按钮是触发操作的主要组件，有三种主要样式。

| 变量名 | 样式 | 状态 | 元素 | 说明 |
|--------|------|------|------|------|
| `--mat-button-filled-container-color` | filled | default | container | 实心按钮背景 |
| `--mat-button-filled-label-text-color` | filled | default | label | 实心按钮文本 |
| `--mat-button-filled-ripple-color` | filled | default | ripple | 实心按钮波纹 |
| `--mat-button-filled-hover-state-layer-color` | filled | hover | state-layer | 悬停状态层 |
| `--mat-button-filled-disabled-container-color` | filled | disabled | container | 禁用实心按钮 |
| `--mat-button-outlined-label-text-color` | outlined | default | label | 轮廓按钮文本 |
| `--mat-button-outlined-outline-color` | outlined | default | outline | 轮廓按钮边框 |
| `--mat-button-protected-container-color` | protected | default | container | 保护按钮背景 |
| `--mat-button-text-label-text-color` | text | default | label | 文本按钮 |
| `--mat-button-text-ripple-color` | text | default | ripple | 文本按钮波纹 |

**按钮样式：**
- `filled`: 实心按钮（主要操作）
- `outlined`: 轮廓按钮（次要操作）
- `text`: 文本按钮（低优先级操作）
- `protected`: 保护按钮

**按钮状态：**
- `default`: 默认
- `hover`: 悬停
- `focus`: 聚焦
- `pressed`: 按下
- `disabled`: 禁用

---

### 3. SLIDE - 滑动开关 (36 个变量)

也称为 Toggle Switch，用于二进制状态切换。

| 变量名 | 元素 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-slide-toggle-selected-track-color` | track | selected | 选中轨道颜色 |
| `--mat-slide-toggle-selected-handle-color` | handle | selected | 选中滑块颜色 |
| `--mat-slide-toggle-selected-icon-color` | icon | selected | 选中图标颜色 |
| `--mat-slide-toggle-unselected-track-color` | track | unselected | 未选中轨道 |
| `--mat-slide-toggle-unselected-track-outline-color` | track | unselected | 未选中轨道边框 |
| `--mat-slide-toggle-disabled-selected-track-color` | track | selected, disabled | 禁用选中轨道 |
| `--mat-slide-toggle-focus-state-layer-color` | state-layer | focus | 聚焦状态层 |
| `--mat-slide-toggle-label-text-color` | label | - | 标签文本 |

**元素：**
- `track`: 轨道（滑动槽）
- `handle`: 滑块（可拖动部分）
- `icon`: 滑块内的图标（通常是勾选标记）
- `label`: 标签文本

---

### 4. DATEPICKER - 日期选择器 (29 个变量)

用于选择日期的日历组件。

| 变量名 | 部分 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-datepicker-calendar-container-background-color` | calendar | - | 日历容器背景 |
| `--mat-datepicker-calendar-date-text-color` | date | - | 日期文本 |
| `--mat-datepicker-calendar-date-selected-state-background-color` | date | selected | 选中日期背景 |
| `--mat-datepicker-calendar-date-in-range-state-background-color` | date | in-range | 范围内日期 |
| `--mat-datepicker-calendar-date-today-outline-color` | date | today | 今天日期边框 |
| `--mat-datepicker-calendar-date-focus-state-background-color` | date | focus | 聚焦日期 |
| `--mat-datepicker-calendar-header-divider-color` | header | - | 头部分割线 |

**日期状态：**
- `today`: 今天
- `selected`: 选中
- `in-range`: 在范围内
- `in-comparison-range`: 在对比范围内
- `preview`: 预览状态
- `disabled`: 禁用

---

### 5. CHIP - 芯片标签 (23 个变量)

用于显示实体、属性或操作的紧凑元素。

| 变量名 | 样式 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-chip-label-text-color` | - | - | 芯片标签文本 |
| `--mat-chip-outline-color` | - | - | 芯片边框 |
| `--mat-chip-elevated-container-color` | elevated | - | 凸起芯片背景 |
| `--mat-chip-selected-label-text-color` | - | selected | 选中芯片文本 |
| `--mat-chip-selected-trailing-icon-color` | - | selected | 选中芯片尾图标 |
| `--mat-chip-disabled-label-text-color` | - | disabled | 禁用芯片 |
| `--mat-chip-focus-outline-color` | - | focus | 聚焦边框 |

**芯片样式：**
- `flat`: 扁平芯片
- `elevated`: 凸起芯片（带阴影）
- `outlined`: 轮廓芯片

---

### 6. LIST - 列表 (20 个变量)

用于显示行或数据项。

| 变量名 | 元素 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-list-list-item-container-color` | item | - | 列表项容器 |
| `--mat-list-list-item-label-text-color` | item | - | 列表项标签 |
| `--mat-list-list-item-leading-icon-color` | item | leading | 前导图标 |
| `--mat-list-list-item-trailing-icon-color` | item | trailing | 尾随图标 |
| `--mat-list-list-item-disabled-label-text-color` | item | disabled | 禁用列表项 |
| `--mat-list-active-indicator-color` | indicator | - | 活动指示器 |

**列表项元素：**
- `leading-icon`: 前导图标（左侧）
- `trailing-icon`: 尾随图标（右侧）
- `supporting-text`: 辅助文本
- `avatar`: 头像

---

### 7. CHECKBOX - 复选框 (19 个变量)

用于多选场景。

| 变量名 | 状态 | 元素 | 说明 |
|--------|------|------|------|
| `--mat-checkbox-selected-icon-color` | selected | icon | 选中复选框 |
| `--mat-checkbox-selected-checkmark-color` | selected | checkmark | 选中勾号 |
| `--mat-checkbox-unselected-icon-color` | unselected | icon | 未选中复选框 |
| `--mat-checkbox-disabled-selected-icon-color` | selected, disabled | icon | 禁用已选中 |
| `--mat-checkbox-label-text-color` | - | label | 标签文本 |

**复选框状态：**
- `selected`: 选中
- `unselected`: 未选中
- `disabled`: 禁用
- `hover`: 悬停
- `focus`: 聚焦
- `pressed`: 按下

---

### 8. STEPPER - 步骤条 (18 个变量)

显示多步骤流程的进度。

| 变量名 | 部分 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-stepper-header-icon-background-color` | header | icon | 头部图标背景 |
| `--mat-stepper-header-icon-foreground-color` | header | icon | 头部图标前景 |
| `--mat-stepper-header-label-text-color` | header | label | 头部标签文本 |
| `--mat-stepper-header-selected-state-icon-background-color` | header | selected | 选中步骤图标 |
| `--mat-stepper-header-done-state-icon-foreground-color` | header | done | 完成步骤图标 |
| `--mat-stepper-header-error-state-label-text-color` | header | error | 错误步骤文本 |
| `--mat-stepper-container-color` | container | - | 步骤条容器 |

**步骤状态：**
- `selected`: 当前步骤
- `done`: 已完成
- `edit`: 可编辑
- `error`: 错误

---

### 9. SLIDER - 滑块 (17 个变量)

用于在数值范围内选择值。

| 变量名 | 元素 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-slider-active-track-color` | track | active | 活动轨道（已选择部分） |
| `--mat-slider-inactive-track-color` | track | inactive | 非活动轨道 |
| `--mat-slider-handle-color` | handle | - | 滑块手柄 |
| `--mat-slider-focus-handle-color` | handle | focus | 聚焦手柄 |
| `--mat-slider-disabled-active-track-color` | track | disabled, active | 禁用活动轨道 |
| `--mat-slider-with-tick-marks-active-container-color` | container | with-tick-marks | 带刻度标记 |

**滑块元素：**
- `track`: 轨道
- `handle`: 手柄
- `label`: 数值标签
- `tick-marks`: 刻度标记

---

### 10. TAB - 标签页 (16 个变量)

用于组织内容到不同的面板。

| 变量名 | 状态 | 元素 | 说明 |
|--------|------|------|------|
| `--mat-tab-active-label-text-color` | active | label | 活动标签文本 |
| `--mat-tab-active-indicator-color` | active | indicator | 活动指示器 |
| `--mat-tab-inactive-label-text-color` | inactive | label | 非活动标签 |
| `--mat-tab-disabled-ripple-color` | disabled | ripple | 禁用波纹 |
| `--mat-tab-divider-color` | - | divider | 标签分隔符 |

---

### 11. FAB - 浮动操作按钮 (14 个变量)

浮在内容之上的圆形按钮，用于主要操作。

| 变量名 | 变体 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-fab-container-color` | regular | - | 标准 FAB 背景 |
| `--mat-fab-foreground-color` | regular | - | 标准 FAB 前景 |
| `--mat-fab-small-container-color` | small | - | 小型 FAB |
| `--mat-fab-small-foreground-color` | small | - | 小型 FAB 前景 |
| `--mat-fab-disabled-state-container-color` | - | disabled | 禁用 FAB |

---

### 12. RADIO - 单选按钮 (14 个变量)

用于单选场景。

| 变量名 | 状态 | 元素 | 说明 |
|--------|------|------|------|
| `--mat-radio-selected-icon-color` | selected | icon | 选中单选按钮 |
| `--mat-radio-unselected-icon-color` | unselected | icon | 未选中单选按钮 |
| `--mat-radio-disabled-selected-icon-color` | selected, disabled | icon | 禁用已选中 |
| `--mat-radio-label-text-color` | - | label | 标签文本 |

---

### 13. EXPANSION - 展开面板 (9 个变量)

可展开/折叠的内容容器。

| 变量名 | 部分 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-expansion-container-background-color` | container | - | 容器背景 |
| `--mat-expansion-header-text-color` | header | - | 头部文本 |
| `--mat-expansion-header-indicator-color` | header | indicator | 展开/折叠指示器 |
| `--mat-expansion-container-text-color` | container | - | 容器文本 |

---

### 14. PSEUDO - 伪复选框 (8 个变量)

用于列表项中的虚拟复选框。

| 变量名 | 类型 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-pseudo-checkbox-full-selected-icon-color` | full | selected | 全尺寸选中 |
| `--mat-pseudo-checkbox-minimal-selected-checkmark-color` | minimal | selected | 最小尺寸选中 |

---

### 15. SELECT - 下拉选择 (8 个变量)

用于从选项中选择一个值。

| 变量名 | 部分 | 状态 | 说明 |
|--------|------|------|------|
| `--mat-select-enabled-arrow-color` | trigger | enabled | 启用箭头 |
| `--mat-select-disabled-arrow-color` | trigger | disabled | 禁用箭头 |
| `--mat-select-panel-background-color` | panel | - | 下拉面板背景 |
| `--mat-select-placeholder-text-color` | placeholder | - | 占位符文本 |

---

## 🎯 状态模式总结

Angular Material 组件通常支持以下交互状态：

| 状态 | CSS 类 | 说明 |
|------|---------|------|
| `default` | `.mat-mdc-` | 默认状态 |
| `hover` | `:hover` | 鼠标悬停 |
| `focus` | `.mdc-checkbox--focused` | 键盘聚焦 |
| `pressed` | `:active` | 按下状态 |
| `disabled` | `[disabled]` | 禁用状态 |
| `selected` | `.mat-mdc-selected` | 选中状态 |
| `active` | `.mat-mdc-active` | 活动状态 |

---

## 💡 使用建议

### 1. 优先使用组件变量

```css
/* ✅ 推荐：使用组件特定的变量 */
.custom-button {
  background-color: var(--mat-button-filled-container-color);
  color: var(--mat-button-filled-label-text-color);
}

/* ❌ 避免：直接使用系统令牌 */
.custom-button {
  background-color: var(--mat-sys-primary);
}
```

### 2. 主题切换

```css
/* 自动跟随主题切换 */
.my-component {
  background-color: var(--mat-app-background-color);
  color: var(--mat-app-text-color);
}
```

### 3. 自定义组件

```css
/* 为自定义组件使用 Material Design 令牌 */
.custom-card {
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  border-radius: 8px;
  box-shadow: var(--mat-app-elevation-shadow-level-1);
}
```

---

## 📚 参考资源

- [Angular Material 官方文档](https://material.angular.io)
- [Material Design 3 颜色系统](https://m3.material.io/styles/color)
- [Material Design 3 令牌](https://m3.material.io/foundations/design-tokens/overview)

---

## 🔄 版本信息

- **Angular Material 版本**: 基于 v21 预构建主题
- **分析文件**: `pink-bluegrey.css`
- **生成日期**: 2026-03-23
- **文档版本**: 1.0.0

---

*此文档由自动化工具生成，基于对 Angular Material 预构建主题 CSS 文件的分析。*
