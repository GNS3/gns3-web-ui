# Angular Material CSS 变量完整参考

> 基于 Angular Material 21 预构建主题的完整分析
>
> 分析文件: `pink-bluegrey.css`
>
> 生成时间: 2026-03-23

---

## 📊 总体统计

| 类别 | 数量 | 说明 |
|------|------|------|
| **总 CSS 变量** | **970 个** | 去重后的唯一变量 |
| **颜色相关变量** | **401 个** | 以 `-color` 结尾的变量 |
| **组件/模块数量** | **39 个** | 包含系统和应用级 |
| **系统级令牌** | **4 个** | Material Design 核心令牌 |

---

## 📈 变量分布统计

| 排名 | 组件 | 变量数量 | 占比 | 主要用途 |
|:----:|------|:--------:|:----:|----------|
| 1 | `button` | 150 | 15.5% | 按钮组件（4种样式） |
| 2 | `form` | 87 | 9.0% | 表单字段输入 |
| 3 | `slide` | 83 | 8.6% | 滑动开关 |
| 4 | `list` | 52 | 5.4% | 列表项 |
| 5 | `chip` | 47 | 4.8% | 芯片标签 |
| 6 | `fab` | 44 | 4.5% | 浮动操作按钮 |
| 7 | `slider` | 44 | 4.5% | 滑块 |
| 8 | `datepicker` | 41 | 4.2% | 日期选择器 |
| 9 | `checkbox` | 33 | 3.4% | 复选框 |
| 10 | `badge` | 28 | 2.9% | 徽章 |
| 11 | `stepper` | 28 | 2.9% | 步骤条 |
| 12 | `app` | 27 | 2.8% | 应用级变量 |
| 13 | `expansion` | 25 | 2.6% | 展开面板 |
| 14 | `tab` | 25 | 2.6% | 标签页 |
| 15 | `radio` | 24 | 2.5% | 单选按钮 |
| 16 | `dialog` | 23 | 2.4% | 对话框 |
| 17 | `table` | 23 | 2.4% | 表格 |
| 18 | `card` | 22 | 2.3% | 卡片 |
| 19 | `menu` | 21 | 2.2% | 菜单 |
| 20 | `paginator` | 16 | 1.6% | 分页器 |
| 21 | `select` | 15 | 1.5% | 下拉选择 |
| 22 | `icon` | 14 | 1.4% | 图标 |
| 23 | `option` | 10 | 1.0% | 选项 |
| 24 | `sidenav` | 9 | 0.9% | 侧边栏 |
| 25 | `toolbar` | 9 | 0.9% | 工具栏 |
| 26 | `bottom` | 8 | 0.8% | 底部面板 |
| 27 | `progress` | 8 | 0.8% | 进度条 |
| 28 | `pseudo` | 8 | 0.8% | 伪复选框 |
| 29 | `snack` | 8 | 0.8% | Snackbar 提示 |
| 30 | `tooltip` | 8 | 0.8% | 工具提示 |
| 31 | `optgroup` | 6 | 0.6% | 选项组 |
| 32 | `tree` | 6 | 0.6% | 树形控件 |
| 33 | `grid` | 4 | 0.4% | 网格列表 |
| 34 | `sys` | 4 | 0.4% | 系统级令牌 |
| 35 | `autocomplete` | 3 | 0.3% | 自动完成 |
| 36 | `timepicker` | 3 | 0.3% | 时间选择器 |
| 37 | `divider` | 2 | 0.2% | 分割线 |
| 38 | `ripple` | 1 | 0.1% | 波纹效果 |
| 39 | `sort` | 1 | 0.1% | 排序 |

---

## 🎨 变量命名规范

### 命名结构

```
--mat-{level}-{component}-{property}-{variant}-{state}-{element}
```

### 命名层级说明

| 层级 | 说明 | 可选值 | 示例 |
|------|------|--------|------|
| `level` | 变量级别 | `app`, `sys` | `--mat-app-background-color` |
| `component` | 组件名称 | 39个组件 | `--mat-button-*` |
| `property` | 属性类型 | `container`, `label`, `icon` 等 | `--mat-button-filled-container-*` |
| `variant` | 变体 | `filled`, `outlined`, `elevated` 等 | `--mat-button-outlined-*` |
| `state` | 状态 | `disabled`, `hover`, `focus` 等 | `--mat-button-filled-disabled-*` |
| `element` | 子元素 | `text`, `background`, `outline` 等 | `--mat-button-filled-label-text-color` |

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

Material Design 3 的核心设计令牌，所有组件都基于这些令牌构建。

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

为整个应用提供默认值的高级别变量。

| 变量 | 用途 | 默认值来源 |
|------|------|-----------|
| `--mat-app-background-color` | 应用背景色 | `--mat-sys-background` |
| `--mat-app-text-color` | 应用文本色 | `--mat-sys-on-background` |
| `--mat-app-elevation-shadow-level-0` ~ `level-8` | 阴影级别 | 0-8 级阴影系统 |

### 阴影级别说明

| 级别 | 使用场景 | CSS 值 |
|------|----------|--------|
| Level 0 | 无阴影（平面） | `0px 0px 0px 0px` |
| Level 1 | 卡片、按钮默认 | `0px 2px 1px -1px` |
| Level 2 | 轻微提升 | `0px 3px 1px -2px` |
| Level 3 | 下拉菜单 | `0px 3px 3px -2px` |
| Level 4 | 对话框 | `0px 2px 4px -1px` |
| Level 5 | 中等提升 | `0px 3px 5px -1px` |
| Level 6 | 较高提升 | `0px 3px 5px -1px` |
| Level 7 | 高提升 | `0px 4px 5px -2px` |
| Level 8 | 最高提升（模态） | `0px 6px 10px -1px` |

---

## 📚 文档结构

本文档包含以下部分：

1. **本文档** - 索引和统计信息
2. **[完整变量列表](material-css-variables-complete.md)** - 所有 970 个变量的详细表格
3. **[简化参考](material-css-variables.md)** - 常用变量快速参考

---

## 🎯 组件分类

### 输入控件 (11 个)
- `button` - 按钮
- `form` - 表单字段
- `slide` - 滑动开关
- `slider` - 滑块
- `checkbox` - 复选框
- `radio` - 单选按钮
- `select` - 下拉选择
- `option` - 选项
- `autocomplete` - 自动完成
- `datepicker` - 日期选择器
- `timepicker` - 时间选择器

### 布局组件 (8 个)
- `card` - 卡片
- `dialog` - 对话框
- `expansion` - 展开面板
- `grid` - 网格列表
- `list` - 列表
- `sidenav` - 侧边栏
- `table` - 表格
- `toolbar` - 工具栏

### 导航组件 (4 个)
- `menu` - 菜单
- `paginator` - 分页器
- `stepper` - 步骤条
- `tab` - 标签页

### 反馈组件 (6 个)
- `badge` - 徽章
- `bottom` - 底部面板
- `progress` - 进度条
- `snack` - Snackbar
- `tooltip` - 工具提示
- `tree` - 树形控件

### 装饰组件 (3 个)
- `chip` - 芯片
- `divider` - 分割线
- `icon` - 图标

### 操作按钮 (1 个)
- `fab` - 浮动操作按钮

### 辅助组件 (6 个)
- `app` - 应用级
- `optgroup` - 选项组
- `pseudo` - 伪复选框
- `ripple` - 波纹效果
- `sort` - 排序
- `sys` - 系统级

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

## 📖 快速链接

- [Angular Material 官方文档](https://material.angular.io)
- [Material Design 3 颜色系统](https://m3.material.io/styles/color)
- [Material Design 3 令牌](https://m3.material.io/foundations/design-tokens/overview)

---

## 🔄 版本信息

- **Angular Material 版本**: 基于 v21 预构建主题
- **分析文件**: `pink-bluegrey.css`
- **生成日期**: 2026-03-23
- **文档版本**: 2.0.0

---

*此文档由自动化工具生成，基于对 Angular Material 预构建主题 CSS 文件的完整分析。*
