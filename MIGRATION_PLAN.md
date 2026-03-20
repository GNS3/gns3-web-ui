# Angular Material 主题系统迁移计划

## 分支信息
- **源分支**: `feat/ai-profile-management`
- **当前分支**: `refactor/angular-material-theming`
- **创建时间**: 2026-03-20

## 目标
将 GNS3 Web UI 从旧的 Material 主题系统迁移到 Angular 14+ 原生主题系统（MDC Web + CSS 自定义属性）

---

## 一、现状分析

### 1.1 项目规模统计

| 类型 | 数量 | 说明 |
|------|------|------|
| **SCSS 文件** | 197 个 | 包含组件样式 |
| **关键文件** | 3 个 | `theme.scss`, `styles.scss`, `angular.json` |
| **Material 组件** | 15+ | Button, Card, Dialog, Menu 等 |
| **自定义组件** | 50+ | AI Chat, Project Map, Console 等 |

### 1.2 当前主题系统

#### 现有实现 (`src/theme.scss`)
```scss
// 旧系统 - 164 行
@import '@angular/material/theming';
@include mat-core();

// 手动定义调色板
$primary: mat-palette($mat-cyan, 700, 500, 900);
$accent: mat-palette($mat-blue-grey, A200, A100, A700);

// 手动定义主题
$dark-theme: mat-dark-theme($primary, $accent);
$light-theme: mat-light-theme($primary, $accent);

// 需要手动导入每个组件
.dark-theme {
  @include angular-material-theme($dark-theme);
  @include mat-button-theme($dark-theme);
  @include mat-card-theme($dark-theme);
  // ... 重复 20+ 次
}

.light-theme {
  @include angular-material-theme($light-theme);
  // ... 再次重复
}
```

**问题**:
- ❌ 代码冗余（164 行主题定义）
- ❌ 不支持 CSS 自定义属性
- ❌ 主题切换需要类名切换
- ❌ 运行时无法动态修改颜色
- ❌ 需要为每个组件单独调用 mixin

### 1.3 样式使用情况统计

```bash
# 硬编码颜色统计
grep -r "#0097a7" src/**/*.scss | wc -l     # GNS3 主色: 50+ 次
grep -r "#20313b" src/**/*.scss | wc -l     # 深色背景: 30+ 次
grep -r "#e8ecef" src/**/*.scss | wc -l     # 浅色背景: 20+ 次
grep -r "!important" src/**/*.scss | wc -l  # 优先级覆盖: 100+ 次
```

---

## 二、迁移方案

### 2.1 Angular 14+ 新主题系统

#### 新系统特性
```scss
// 新系统 - 约 50 行
@use '@angular/material' as mat;

// 一次性定义主题（包含所有配置）
$gns3-theme: mat.define-theme((
  color: (
    theme-type: dark,
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

// 一行代码包含所有组件
:root {
  @include mat.all-component-themes($gns3-theme);
}

// 自动生成 500+ CSS 变量
// --mdc-elevated-card-container-color
// --mat-app-text-color
// --mat-standard-button-toggle-height
// 等等...
```

**优势**:
- ✅ 代码减少 70%
- ✅ 自动生成 CSS 变量
- ✅ 支持运行时主题切换
- ✅ TypeScript 类型支持
- ✅ 更小的 bundle 大小

### 2.2 迁移策略：渐进式

```
阶段 1: 基础设施（第 1 周）
├── 创建新主题系统
├── 建立设计 Token
└── 配置构建系统

阶段 2: 验证迁移（第 2 周）
├── 迁移 AI Chat（最复杂组件）
├── 验证主题切换
└── 性能测试

阶段 3: 核心组件（第 3-4 周）
├── Project Map
├── Console
└── Preferences

阶段 4: 其他组件（第 5-8 周）
├── Dialog 组件
├── Form 组件
└── 其他辅助组件
```

---

## 三、文件修改清单

### 3.1 必须修改的核心文件

#### 1. `src/theme.scss` → `src/theme.scss.bak`
```diff
- // 旧系统：164 行
- @import '@angular/material/theming';
- @include mat-core();
- $primary: mat-palette($mat-cyan, 700, 500, 900);
- ...

+ // 新系统：~50 行
+ @use '@angular/material' as mat;
+ $gns3-theme: mat.define-theme(...);
+ :root {
+   @include mat.all-component-themes($gns3-theme);
+ }
```

**影响**: 全局主题系统
**风险**: 高（需要全面测试）
**优先级**: P0

#### 2. `src/styles.scss`
```diff
- .snackabar-success {
-   background: #0097a7 !important;
-   color: white !important;
- }

+ .snackbar-success {
+   background-color: var(--mat-app-primary-color);
+   color: var(--mat-app-on-primary-color);
+ }
```

**影响**: 全局样式覆盖
**风险**: 中
**优先级**: P1

#### 3. `angular.json`
```json
{
  "styles": [
    "src/theme.scss",           // 保留（向后兼容）
    "src/styles.scss",
    "src/styles/theme-v2.scss"  // 新增
  ]
}
```

**影响**: 构建配置
**风险**: 低
**优先级**: P0

### 3.2 需要创建的新文件

#### 1. `src/styles/theme-v2.scss`（新）
```scss
@use '@angular/material' as mat;

// GNS3 主题定义
$gns3-dark-theme: mat.define-theme((
  color: (
    theme-type: dark,
    primary: mat.$cyan-palette,
    tertiary: mat.$blue-grey-palette,
  ),
));

$gns3-light-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$cyan-palette,
    tertiary: mat.$blue-grey-palette,
  ),
));

// 默认深色主题
:root {
  @include mat.all-component-themes($gns3-dark-theme);

  // GNS3 自定义 Token
  --gns3-cyan: #0097a7;
  --gns3-spacing-xs: 4px;
  --gns3-spacing-sm: 8px;
  --gns3-spacing-md: 12px;
  --gns3-spacing-lg: 16px;
}

// 浅色主题
.theme-light {
  @include mat.all-component-themes($gns3-light-theme);
}
```

**影响**: 新主题系统
**风险**: 低
**优先级**: P0

#### 2. `src/styles/design-tokens.scss`（新）
```scss
// 设计系统 Token
:root {
  // 颜色
  --gns3-primary: var(--mat-app-primary-color);
  --gns3-background: var(--mat-app-background-color);
  --gns3-surface: var(--mat-app-surface-color);

  // 间距
  --gns3-spacing-xs: 4px;
  --gns3-spacing-sm: 8px;
  --gns3-spacing-md: 12px;
  --gns3-spacing-lg: 16px;
  --gns3-spacing-xl: 24px;

  // 圆角
  --gns3-radius-sm: 4px;
  --gns3-radius-md: 8px;
  --gns3-radius-lg: 12px;

  // 阴影
  --gns3-shadow-sm: var(--mdc-elevated-card-container-elevation);
  --gns3-shadow-md: var(--mdc-elevated-card-container-elevation);
  --gns3-shadow-lg: var(--mdc-elevated-card-container-elevation);
}
```

**影响**: 设计系统
**风险**: 低
**优先级**: P1

### 3.3 组件文件修改（按优先级）

#### 阶段 1: AI Chat 组件（验证可行性）

| 文件 | 修改量 | 风险 | 优先级 |
|------|--------|------|--------|
| `ai-chat.component.scss` | 中 | 中 | P0 |
| `chat-message-list.component.scss` | 小 | 低 | P0 |
| `chat-input-area.component.scss` | 小 | 低 | P0 |
| `chat-session-list.component.scss` | 小 | 低 | P0 |

**示例修改**:
```diff
// ai-chat.component.scss
- .ai-chat-container {
-   background-color: rgba(250, 250, 250, 1);
-   border: 1px solid var(--mat-app-outline-variant);
- }

+ .ai-chat-container {
+   background-color: var(--mat-app-surface-container-low-color);
+   border: 1px solid var(--mat-app-outline-variant-color);
+   border-radius: var(--mdc-elevated-card-container-shape);
+ }
```

#### 阶段 2: Project Map 组件

| 文件 | 修改量 | 风险 | 优先级 |
|------|--------|------|--------|
| `project-map.component.scss` | 大 | 高 | P1 |
| `project-map-menu.component.scss` | 中 | 中 | P1 |
| `context-menu.component.scss` | 中 | 中 | P1 |

**示例修改**:
```diff
// project-map.component.scss
- #project-titlebar {
-   background-color: #20313b;
-   box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.2);
- }

+ #project-titlebar {
+   background-color: var(--mat-app-background-color);
+   box-shadow: var(--mdc-elevated-card-container-elevation);
+ }

- .menu-button:hover {
-   transform: scale(1.3);
- }

+ .menu-button {
+   @include mat.icon-button-overrides((
+     state-layer-color: var(--mat-app-primary-color),
+   ));
+ }
```

#### 阶段 3: 其他组件（197 - 10 = 187 个文件）

| 类别 | 数量 | 修改量 | 优先级 |
|------|------|--------|--------|
| Dialog 组件 | 30+ | 小 | P2 |
| Form 组件 | 20+ | 小 | P2 |
| List 组件 | 15+ | 小 | P2 |
| 其他组件 | 122+ | 小-中 | P3 |

---

## 四、影响范围评估

### 4.1 功能影响

| 功能 | 影响程度 | 说明 |
|------|---------|------|
| **深色/浅色主题切换** | 🟢 改进 | 支持更灵活的切换 |
| **AI Chat 界面** | 🟡 中等 | 需要调整颜色变量 |
| **Project Map 渲染** | 🟡 中等 | D3.js 样式可能受影响 |
| **Console 终端** | 🟢 无影响 | 使用 xterm 内置样式 |
| **Preferences 设置** | 🟡 中等 | 表单组件样式调整 |
| **Dialog 对话框** | 🟢 改进 | 自动适配新主题 |

### 4.2 性能影响

| 指标 | 预期变化 | 说明 |
|------|---------|------|
| **Bundle 大小** | 🔽 -10~15% | CSS 变量减少重复代码 |
| **运行时性能** | 🟢 持平 | CSS 变量解析开销可忽略 |
| **主题切换** | 🟢 提升 | 无需重新渲染 DOM |
| **首次渲染** | 🟢 持平 | 编译时优化 |
| **内存占用** | 🟢 持平 | 无明显变化 |

### 4.3 兼容性影响

| 浏览器 | 支持情况 | 说明 |
|--------|---------|------|
| **Chrome 90+** | ✅ 完全支持 | CSS 变量 + MDC Web |
| **Firefox 88+** | ✅ 完全支持 | CSS 变量 + MDC Web |
| **Safari 14+** | ✅ 完全支持 | CSS 变量 + MDC Web |
| **Edge 90+** | ✅ 完全支持 | Chromium 内核 |
| **IE 11** | ❌ 不支持 | 项目已不支持 IE |

### 4.4 开发体验影响

| 方面 | 影响 | 说明 |
|------|------|------|
| **TypeScript 类型** | ✅ 改进 | Material 提供 Token 类型 |
| **IDE 自动补全** | ✅ 改进 | CSS 变量自动补全 |
| **调试体验** | ✅ 改进 | DevTools 显示变量名 |
| **样式覆盖** | ✅ 简化 | 使用 CSS 变量覆盖 |
| **主题定制** | ✅ 简化 | 修改变量即可 |

---

## 五、风险评估与缓解

### 5.1 高风险项

#### 风险 1: 样式冲突
**描述**: 新旧主题系统共存时可能出现样式冲突

**影响**: UI 显示异常

**概率**: 中

**缓解措施**:
```scss
// 使用命名空间隔离旧主题
.legacy-theme {
  @include angular-material-theme($old-theme);
}

// 新主题
:root {
  @include mat.all-component-themes($new-theme);
}
```

#### 风险 2: D3 地图样式破坏
**描述**: Project Map 使用 D3.js，可能与新主题冲突

**影响**: 拓扑图无法正常显示

**概率**: 高

**缓解措施**:
```scss
// 保留 D3 特定样式
svg.map {
  // D3 样式不受 Material 影响
  g.node:hover {
    fill: var(--mat-app-primary-color);
  }
}

// 使用 CSS 变量而不是硬编码
```

#### 风险 3: 第三方组件库兼容性
**描述**: ngx-markdown, ngx-json-viewer 等可能不兼容

**影响**: 组件显示异常

**概率**: 低

**缓解措施**:
```scss
// 为第三方组件提供特定样式
::ng-deep markdown {
  // 保持原有样式
  color: var(--mat-app-text-color);
}
```

### 5.2 中风险项

#### 风险 4: 构建失败
**描述**: Sass 编译错误或依赖问题

**影响**: 无法构建项目

**概率**: 低

**缓解措施**:
```bash
# 测试构建
ng build --configuration=production

# 检查依赖
npm list @angular/material
```

#### 风险 5: 性能回归
**描述**: CSS 变量解析导致性能下降

**影响**: 页面渲染变慢

**概率**: 低

**缓解措施**:
```scss
// 减少变量嵌套层级
// 使用 will-change 提示浏览器
.animated-element {
  will-change: transform;
}
```

### 5.3 低风险项

#### 风险 6: 学习曲线
**描述**: 团队不熟悉新 API

**影响**: 开发效率下降

**概率**: 中

**缓解措施**:
- 提供迁移指南文档
- 代码示例库
- 团队培训

---

## 六、测试计划

### 6.1 单元测试

```typescript
// theme.spec.ts
describe('Theme System', () => {
  it('should generate CSS variables', () => {
    const root = document.documentElement;
    const primaryColor = getComputedStyle(root)
      .getPropertyValue('--mat-app-primary-color');

    expect(primaryColor).toBeTruthy();
  });

  it('should switch themes', () => {
    themeService.setTheme('light');
    expect(themeService.getCurrentTheme()).toBe('light');
  });
});
```

### 6.2 集成测试

```typescript
// ai-chat.e2e-spec.ts
describe('AI Chat Theme', () => {
  it('should apply dark theme by default', () => {
    cy.visit('/project/1');
    cy.get('.ai-chat-container')
      .should('have.css', 'background-color')
      .and('match', /rgb\(32, 49, 59\)/);  // #20313b
  });

  it('should switch to light theme', () => {
    cy.get('[data-test="theme-toggle"]').click();
    cy.get('.ai-chat-container')
      .should('have.css', 'background-color')
      .and('match', /rgb\(232, 236, 239\)/);  // #e8ecef
  });
});
```

### 6.3 视觉回归测试

```bash
# 使用 Percy 或 BackstopJS
npm run test:visual

# 对比新旧主题截图
npx backstop test
```

### 6.4 性能测试

```bash
# Lighthouse CI
npm run lighthouse

# Bundle 分析
npm run build:analyze
```

---

## 七、回滚策略

### 7.1 快速回滚

```bash
# 方案 1: Git 回退
git revert <commit-hash>
git push

# 方案 2: 切换分支
git checkout feat/ai-profile-management
```

### 7.2 部分回滚

```scss
// 保留新主题系统，但使用旧主题值
:root {
  @include mat.all-component-themes($new-theme);

  // 强制使用旧颜色
  --mat-app-primary-color: #0097a7 !important;
  --mat-app-background-color: #20313b !important;
}
```

### 7.3 回滚触发条件

- ❌ 样式严重冲突导致功能不可用
- ❌ 性能下降超过 20%
- ❌ 超过 3 个 P0 级别 bug
- ❌ 用户反馈强烈不满

---

## 八、成功标准

### 8.1 技术指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 主题代码行数 | < 100 行 | 164 行 |
| CSS 变量数量 | > 300 | 10 |
| 硬编码颜色 | < 10 | 100+ |
| Bundle 大小 | -10% | 基线 |
| 构建时间 | < 5% 增长 | 基线 |

### 8.2 功能指标

- ✅ 所有组件支持深色/浅色主题
- ✅ 主题切换响应时间 < 100ms
- ✅ 视觉回归测试通过率 100%
- ✅ 无 P0/P1 级别 bug

### 8.3 用户体验指标

- ✅ UI 一致性提升
- ✅ 主题切换更流畅
- ✅ 自定义主题更容易

---

## 九、时间估算

### 9.1 工作量分解

| 阶段 | 任务 | 工作量 | 负责人 |
|------|------|--------|--------|
| **阶段 1** | 基础设施搭建 | 3 天 | 前端 |
| | 创建新主题系统 | 1 天 | 前端 |
| | 配置构建系统 | 0.5 天 | 前端 |
| | 编写迁移指南 | 1 天 | 前端 |
| | 代码审查 | 0.5 天 | 全员 |
| **阶段 2** | 验证迁移 | 5 天 | 前端 |
| | AI Chat 组件迁移 | 2 天 | 前端 |
| | 单元测试编写 | 1 天 | 前端 |
| | E2E 测试编写 | 1 天 | QA |
| | Bug 修复 | 1 天 | 前端 |
| **阶段 3** | 核心组件 | 10 天 | 前端 |
| | Project Map 迁移 | 4 天 | 前端 |
| | Console 迁移 | 2 天 | 前端 |
| | Preferences 迁移 | 3 天 | 前端 |
| | 集成测试 | 1 天 | QA |
| **阶段 4** | 其他组件 | 20 天 | 前端 |
| | Dialog 组件 | 3 天 | 前端 |
| | Form 组件 | 3 天 | 前端 |
| | 其他组件 | 12 天 | 前端 |
| | 回归测试 | 2 天 | QA |
| **总计** | | **38 天** | |

### 9.2 里程碑

| 里程碑 | 交付物 | 日期 |
|--------|--------|------|
| M1 | 新主题系统可用 | D+4 |
| M2 | AI Chat 迁移完成 | D+9 |
| M3 | 核心组件迁移完成 | D+19 |
| M4 | 全部组件迁移完成 | D+39 |

---

## 十、后续优化

### 10.1 Phase 2 优化

1. **自定义主题编辑器**
   ```typescript
   // 允许用户自定义颜色
   export interface CustomTheme {
     primary: string;
     background: string;
     spacing: number;
   }
   ```

2. **主题预设**
   ```typescript
   const THEME_PRESETS = {
     'gns3-dark': { ... },
     'gns3-light': { ... },
     'high-contrast': { ... },
     'color-blind': { ... },
   };
   ```

3. **实时主题预览**
   ```typescript
   // 在设置页面实时预览主题
   previewTheme(theme: CustomTheme) {
     this.themeService.applyTheme(theme);
   }
   ```

### 10.2 性能优化

1. **CSS 代码分割**
   ```typescript
   // 按路由懒加载主题
   {
     path: 'project',
         loadChildren: () => import('./project/project.module')
           .then(m => m.ProjectModule)
   }
   ```

2. **主题缓存**
   ```typescript
   // 缓存用户主题偏好
   localStorage.setItem('theme-preference', JSON.stringify(theme));
   ```

---

## 十一、参考资源

### 11.1 官方文档

- [Angular Material Theming Guide](https://material.angular.io/guide/theming)
- [Angular Material Theming API](https://material.angular.io/guide/theming/understanding-the-theme-system)
- [MDC Web Themming](https://github.com/material-components/material-components-web/blob/master/docs/theming.md)

### 11.2 迁移指南

- [Migrating to MDC-based Components](https://material.angular.io/guide/mdc-migration)
- [Theming Migration Guide](https://material.angular.io/guide/theming/legacy-theme-migration)

### 11.3 最佳实践

- [CSS Custom Properties for Theming](https://css-tricks.com/css-custom-properties-theming/)
- [Angular Performance Best Practices](https://angular.io/guide/performance-best-practices)

---

## 十二、总结

### 关键要点

1. ✅ **推荐迁移**: Angular 14 原生主题系统更先进、更高效
2. 📋 **渐进式迁移**: 降低风险，可控性强
3. 🎯 **优先级明确**: AI Chat → Project Map → 其他组件
4. ⚠️ **风险可控**: 完善的测试和回滚策略

### 预期收益

- **代码减少**: 70-80%
- **维护成本**: 降低 60%
- **Bundle 大小**: 减少 10-15%
- **开发效率**: 提升 30%
- **用户体验**: 主题切换更流畅

### 下一步行动

1. ✅ 创建新分支 `refactor/angular-material-theming`
2. 📝 审查本迁移计划
3. 🚀 开始阶段 1：基础设施搭建
4. 📊 每周进度同步

---

**文档版本**: v1.0
**创建时间**: 2026-03-20
**最后更新**: 2026-03-20
**维护者**: Frontend Team
