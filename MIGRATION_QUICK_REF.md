# Angular Material 主题迁移快速参考

## 核心概念

### Angular 14+ Material 主题系统

```
旧系统 (Angular 13-)          新系统 (Angular 14+)
━━━━━━━━━━━━━━━━━━━━━━━━    ━━━━━━━━━━━━━━━━━━━━━━━━
@import                      @use
mat-palette()               mat.$palette-name
mat-dark-theme()            mat.define-theme()
手动导入组件                 all-component-themes
不支持 CSS 变量             500+ CSS 变量
类名切换                    CSS 变量切换
```

---

## CSS 变量快速查找表

### 颜色变量

| 用途 | 旧值 | 新变量 | 示例值 |
|------|------|--------|--------|
| 主色 | `#0097a7` | `--mat-app-primary-color` | `#0097a7` |
| 深色背景 | `#20313b` | `--mat-app-background-color` | `#20313b` |
| 浅色背景 | `#e8ecef` | `--mat-app-surface-color` | `#ffffff` |
| 文本颜色 | `white` | `--mat-app-on-surface-color` | `rgba(255,255,255,0.87)` |
| 边框颜色 | 自定义 | `--mat-app-outline-variant-color` | `rgba(255,255,255,0.12)` |
| 错误颜色 | `#b00020` | `--mat-app-error-color` | `#f44336` |

### 间距变量

| 用途 | 旧值 | 新变量 |
|------|------|--------|
| 极小间距 | `4px` | `--gns3-spacing-xs` |
| 小间距 | `8px` | `--gns3-spacing-sm` |
| 中间距 | `12px` | `--gns3-spacing-md` |
| 大间距 | `16px` | `--gns3-spacing-lg` |
| 超大间距 | `24px` | `--gns3-spacing-xl` |

### 圆角变量

| 用途 | 旧值 | 新变量 |
|------|------|--------|
| 小圆角 | `4px` | `--gns3-radius-sm` |
| 中圆角 | `8px` | `--gns3-radius-md` |
| 大圆角 | `12px` | `--gns3-radius-lg` |
| 完全圆角 | `50%` | `--gns3-radius-full` |

### 阴影变量

| 用途 | 旧值 | 新变量 |
|------|------|--------|
| 卡片阴影 | 自定义 | `--mdc-elevated-card-container-elevation` |
| 悬浮阴影 | `0 4px 8px rgba(0,0,0,0.2)` | `--mdc-elevated-card-container-elevation` |

### 动画变量

| 用途 | 旧值 | 新变量 |
|------|------|--------|
| 标准时长 | `300ms` | `--mat-standard-motion-duration-long` |
| 标准曲线 | `ease` | `--mat-standard-motion-easing` |

---

## 常见修改模式

### 模式 1: 替换硬编码颜色

```scss
// 修改前
.button {
  background-color: #0097a7;
  color: white;
}

// 修改后
.button {
  background-color: var(--mat-app-primary-color);
  color: var(--mat-app-on-primary-color);
}
```

### 模式 2: 替换阴影

```scss
// 修改前
.card {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

// 修改后
.card {
  box-shadow: var(--mdc-elevated-card-container-elevation);
}
```

### 模式 3: 替换间距

```scss
// 修改前
.container {
  padding: 12px 16px;
  margin-bottom: 8px;
}

// 修改后
.container {
  padding: var(--gns3-spacing-md) var(--gns3-spacing-lg);
  margin-bottom: var(--gns3-spacing-sm);
}
```

### 模式 4: 替换圆角

```scss
// 修改前
.box {
  border-radius: 12px;
}

// 修改后
.box {
  border-radius: var(--gns3-radius-lg);
}
```

### 模式 5: 替换动画

```scss
// 修改前
.element {
  transition: all 300ms ease;
}

// 修改后
.element {
  transition: all var(--mat-standard-motion-duration-long)
                  var(--mat-standard-motion-easing);
}
```

### 模式 6: 移除 !important

```scss
// 修改前
.text {
  color: white !important;
}

// 修改后
.text {
  color: var(--mat-app-on-surface-color);
  // 使用更高优先级的选择器，而不是 !important
}
```

---

## 文件修改检查清单

### 核心文件

- [ ] `src/theme.scss` → 备份为 `theme.scss.bak`
- [ ] `src/styles/theme-v2.scss` → 新建
- [ ] `src/styles/design-tokens.scss` → 新建
- [ ] `src/styles.scss` → 更新
- [ ] `angular.json` → 更新配置

### 服务文件

- [ ] `src/app/services/theme.service.ts` → 更新
- [ ] `src/app/services/theme.service.spec.ts` → 新建测试

### AI Chat 组件

- [ ] `ai-chat.component.scss` → 迁移
- [ ] `chat-message-list.component.scss` → 迁移
- [ ] `chat-input-area.component.scss` → 迁移
- [ ] `chat-session-list.component.scss` → 迁移
- [ ] `tool-call-display.component.scss` → 迁移
- [ ] `tool-details-dialog.component.scss` → 迁移

### Project Map 组件

- [ ] `project-map.component.scss` → 迁移
- [ ] `project-map-menu.component.scss` → 迁移
- [ ] `context-menu.component.scss` → 迁移

---

## 正则表达式替换

### VS Code 查找/替换

```regex
// 颜色替换
查找: #0097a7
替换: var(--mat-app-primary-color)

// 背景颜色
查找: #20313b
替换: var(--mat-app-background-color)

// 文本颜色
查找: color:\s*white(!important)?
替换: color: var(--mat-app-on-surface-color)

// 间距替换
查找: padding:\s*12px
替换: padding: var(--gns3-spacing-md)

// 阴影替换
查找: box-shadow:\s*0\s+4px\s+8px\s+rgba\(0,\s*0,\s*0,\s*0\.2\)
替换: box-shadow: var(--mdc-elevated-card-container-elevation)
```

---

## 测试命令

```bash
# 开发服务器
ng serve

# 构建生产版本
ng build --configuration=production

# 运行单元测试
ng test

# 运行 E2E 测试
ng e2e

# 分析 bundle 大小
ng build --configuration=production --stats-json
webpack-bundle-analyzer dist/stats.json

# 检查样式问题
stylelint "src/**/*.scss"

# 格式化代码
npm run prettier:write
```

---

## 调试技巧

### Chrome DevTools

```javascript
// 1. 查看所有 CSS 变量
const root = document.documentElement;
const styles = getComputedStyle(root);

// 2. 查找特定变量
console.log(styles.getPropertyValue('--mat-app-primary-color'));

// 3. 动态修改变量
root.style.setProperty('--mat-app-primary-color', '#ff0000');

// 4. 列出所有 Material 变量
Object.keys(styles).filter(key => key.startsWith('--mat-')).forEach(key => {
  console.log(`${key}: ${styles.getPropertyValue(key)}`);
});
```

### 性能分析

```javascript
// 1. 测量样式重计算
const start = performance.now();
// 执行样式变更
const end = performance.now();
console.log(`Style recalculation took ${end - start}ms`);

// 2. 检查 CSS 变量使用
performance.getEntriesByType('measure').forEach(entry => {
  if (entry.name.includes('style')) {
    console.log(entry);
  }
});
```

---

## 回滚命令

```bash
# 1. 回退所有更改
git checkout feat/ai-profile-management

# 2. 删除迁移分支
git branch -D refactor/angular-material-theming

# 3. 远程删除分支（如果已推送）
git push origin --delete refactor/angular-material-theming
```

---

## 进度跟踪

### 阶段 1: 基础设施

- [ ] 创建 `theme-v2.scss`
- [ ] 更新 `angular.json`
- [ ] 更新 `ThemeService`
- [ ] 编写单元测试
- [ ] 本地验证

### 阶段 2: AI Chat

- [ ] 迁移主组件
- [ ] 迁移子组件
- [ ] 测试主题切换
- [ ] 视觉回归测试
- [ ] 性能测试

### 阶段 3: 核心组件

- [ ] Project Map
- [ ] Console
- [ ] Preferences

### 阶段 4: 其他组件

- [ ] Dialog 组件
- [ ] Form 组件
- [ ] 其他组件

---

## 注意事项

⚠️ **重要提醒**

1. **不要一次性修改所有文件**
   - 逐个组件迁移
   - 每个组件迁移后都要测试

2. **保留旧主题文件作为备份**
   ```bash
   cp src/theme.scss src/theme.scss.bak
   ```

3. **使用 Git 进行版本控制**
   ```bash
   git add .
   git commit -m "feat: migrate AI Chat to new theme system"
   ```

4. **充分测试后再合并**
   - 单元测试
   - E2E 测试
   - 手动测试
   - 性能测试

5. **关注性能指标**
   - Bundle 大小
   - 渲染性能
   - 主题切换速度

---

## 相关文档

- [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) - 详细迁移计划
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - 技术实施指南
- [Angular Material Theming](https://material.angular.io/guide/theming) - 官方文档

---

**快速联系**

- 项目负责人: Frontend Team
- 技术支持: GitHub Issues
- 文档更新: 2026-03-20
