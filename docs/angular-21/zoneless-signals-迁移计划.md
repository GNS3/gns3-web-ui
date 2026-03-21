# Angular Zoneless 和 Signals 迁移计划

> 创建日期: 2026-03-21
> Angular 版本: 21
> 项目: gns3-web-ui
> 当前状态: Standalone 组件迁移完成 (253/253, 100%)

---

## 目录

1. [概述](#概述)
2. [迁移优势](#迁移优势)
3. [迁移前置条件](#迁移前置条件)
4. [迁移阶段](#迁移阶段)
5. [需要修改的文件清单](#需要修改的文件清单)
6. [风险识别与缓解](#风险识别与缓解)
7. [测试策略](#测试策略)
8. [回滚计划](#回滚计划)

---

## 概述

本计划详细说明了将 GNS3 Web UI 从当前基于 ZoneJS 的变更检测机制迁移到 Zoneless 模式，并引入 Angular Signals 进行响应式状态管理的完整流程。

### 当前状态
- ✓ 所有 253 个组件已迁移为 standalone
- ✓ 项目使用 Angular 21
- ✓ 仍在使用 ZoneJS (见 `src/polyfills.ts` 第 75 行)
- ✓ 使用传统的 `@Input()`/`@Output()` 装饰器
- ✓ 大部分组件使用默认变更检测策略
- ✓ 部分服务使用 `NgZone` (如 `toaster.service.ts`)

### 目标状态
- 移除 ZoneJS 依赖
- 启用 Zoneless 变更检测 (`provideZonelessChangeDetection`)
- 使用 Signals API (`signal`, `computed`, `effect`, `input`, `output`)
- 所有组件使用 `OnPush` 变更检测策略
- 移除 `NgZone` 依赖

---

## 迁移优势

### Zoneless 优势
1. **性能提升**
   - 消除 ZoneJS 的 DOM 事件和异步任务监听开销
   - 减少不必要的变更检测运行
   - 改善 Core Web Vitals (LCP, FID, CLS)

2. **包体积优化**
   - ZoneJS 包体积约 100KB+，移除后显著减少应用体积
   - 减少启动时间开销

3. **调试体验改善**
   - 更清晰的堆栈跟踪
   - 减少 ZoneJS 包装层的复杂性

4. **生态系统兼容性**
   - 避免与新的浏览器 API 的兼容性问题
   - 消除 ZoneJS 的 API monkey patching

### Signals 优势
1. **细粒度响应式**
   - 精确追踪依赖关系
   - 只在数据真正变化时触发更新

2. **更好的类型安全**
   - 编译时类型检查
   - 减少运行时错误

3. **简化状态管理**
   - 减少对 RxJS 的依赖（虽然仍可共存）
   - 更直观的代码结构

---

## 迁移前置条件

### 技术准备
- [x] Angular 21 已安装
- [x] 所有组件已迁移为 standalone
- [ ] 备份当前代码（创建迁移分支）
- [ ] 确保所有测试通过
- [ ] 设置性能基准（使用 Lighthouse 或类似工具）

### 知识准备
团队需要熟悉以下概念：
- Angular Signals API (`signal`, `computed`, `effect`, `input`, `output`)
- Zoneless 变更检测机制
- `ChangeDetectionStrategy.OnPush`
- `ChangeDetectorRef.markForCheck()`
- `AsyncPipe` 的正确使用

---

## 迁移阶段

### 阶段 0: 准备阶段 (预计 2-3 天)

#### 任务清单
1. **创建迁移分支**
   - 从 `master` 创建 `feature/zoneless-signals-migration` 分支

2. **代码分析**
   - 识别所有使用 `NgZone` 的服务
   - 识别所有使用 `@Input()`/`@Output()` 的组件
   - 识别所有使用 `ChangeDetectionStrategy.Default` 的组件
   - 识别所有手动调用 `ChangeDetectorRef.detectChanges()` 的地方

3. **建立测试基准**
   - 运行完整测试套件，记录失败数量
   - 使用 Lighthouse 记录当前性能指标
   - 记录应用体积（`ng build --stats-json`）

4. **文档准备**
   - 创建迁移检查清单
   - 设置每日进度追踪

#### 涉及文件
- 新建: `docs/angular-21/migration-checklist.md`
- 新建: `docs/angular-21/performance-baseline.json`

---

### 阶段 1: NgZone 依赖清理 (预计 3-5 天)

#### 目标
移除所有对 `NgZone` 的直接依赖，为 Zoneless 迁移做准备。

#### 需要修改的文件

##### 服务层 (5 个文件)
1. **src/app/services/toaster.service.ts**
   - 移除 `NgZone` 依赖注入
   - 移除 `zone.run()` 包装
   - 直接调用 `snackbar.open()`

2. **src/app/services/xterm-context-menu.service.ts**
   - 检查并移除 `NgZone` 使用

3. **src/app/components/project-map/project-map.component.ts**
   - 检查并移除 `NgZone` 使用

4. **src/app/components/controllers/controllers.component.ts**
   - 检查并移除 `NgZone` 使用

5. **src/app/cartography/components/text-editor/text-editor.component.ts**
   - 检查并移除 `NgZone` 使用

#### 验证步骤
- 运行测试: `ng test`
- 手动测试所有 toast 通知功能
- 提交代码: `git commit -m "feat: remove NgZone dependencies"`

---

### 阶段 2: 启用 Zoneless (预计 1-2 天)

#### 目标
移除 ZoneJS 并启用 Zoneless 变更检测。

#### 需要修改的文件

1. **src/polyfills.ts**
   - 移除第 75 行: `import 'zone.js';`
   - 如果有 `import 'zone.js/testing';` 也一并移除

2. **src/main.ts**
   - 从 `platformBrowserDynamic().bootstrapModule(AppModule)` 改为使用 `bootstrapApplication`
   - 添加 `provideZonelessChangeDetection()` 到 providers
   - 迁移到 standalone bootstrap 模式

3. **src/app/app.module.ts**
   - 将 `AppModule` 转换为配置格式
   - 提取所有 providers 和 imports 到 `bootstrapApplication` 调用中

4. **angular.json**
   - 移除 `test.polyfills` 中的 `zone.js/testing`
   - 确认 `polyfills` 配置正确

5. **src/test.ts** (Karma 测试配置)
   - 添加 `provideZonelessChangeDetection()` 到 `TestBed.configureTestingModule`
   - 移除对 `zone.js/testing` 的依赖

6. **package.json**
   - 运行 `npm uninstall zone.js`
   - 更新依赖

#### 验证步骤
```bash
# 1. 构建
npm run build

# 2. 检查包体积减小
ls -lh dist/*.js

# 3. 运行测试
ng test --watch=false

# 4. 启动开发服务器
ng serve

# 5. 手动测试核心功能
```

#### 可能的问题和解决方案
- **问题**: 应用启动后无响应
  - **解决**: 检查是否有组件没有使用 Signals 或 AsyncPipe，导致变更检测不触发

- **问题**: 测试失败
  - **解决**: 在测试中添加 `fixture.whenStable()` 替代 `fixture.detectChanges()`

---

### 阶段 3: 核心组件迁移到 Signals (预计 5-7 天)

#### 目标
将核心组件的 `@Input()`/`@Output()` 迁移为 Signal Inputs/Outputs。

#### 迁移优先级

##### 高优先级 (核心功能组件)

1. **src/app/app.component.ts**
   - 将 `darkThemeEnabled` 转换为 signal
   - 将 `componentCssClass` 转换为 computed signal
   - 迁移主题切换逻辑

2. **src/app/components/project-map/project-map.component.ts**
   - 迁移所有 `@Input()` 到 `input()`
   - 迁移所有 `@Output()` 到 `output()`
   - 添加 `ChangeDetectionStrategy.OnPush`
   - 将本地状态转换为 signals

3. **src/cartography/components/d3-map/d3-map.component.ts**
   - 迁移所有 `@Input()` 到 `input()`
   - 添加 `ChangeDetectionStrategy.OnPush`
   - 将 `settings`、`gridVisibility` 等转换为 signals
   - 迁移 D3.js 相关状态

4. **src/app/components/project-map/new-template-dialog/new-template-dialog.component.ts**
   - 迁移表单状态为 signals
   - 使用 `toSignal` 处理 Observable
   - 添加 `ChangeDetectionStrategy.OnPush`

5. **src/layouts/default-layout/default-layout.component.ts**
   - 迁移状态为 signals
   - 添加 `ChangeDetectionStrategy.OnPush`

##### 中优先级 (常用组件)

6. **src/app/components/projects/projects.component.ts**
   - 迁移项目列表为 signals
   - 使用 `toSignal` 处理 HTTP Observable

7. **src/app/components/template/template.component.ts**
   - 迁移模板状态为 signals

8. **src/app/components/project-map/console-wrapper/console-wrapper.component.ts**
   - 迁移控制台状态为 signals

9. **src/app/components/project-map/ai-chat/ai-chat.component.ts**
   - 迁移聊天状态为 signals
   - 处理流式响应

10. **src/app/components/settings/settings.component.ts**
    - 迁移设置状态为 signals

#### 迁移模式

**从 Input Decorator 迁移到 Signal Input**

```typescript
// 之前
export class MyComponent {
  @Input() data: string;
  @Output() dataChange = new EventEmitter<string>();

  constructor(private service: MyService) {}
}

// 之后
import { input, output, inject } from '@angular/core';

export class MyComponent {
  data = input<string>();
  dataChange = output<string>();

  private service = inject(MyService);

  // 使用 computed 派生状态
  formattedData = computed(() => this.data().toUpperCase());
}
```

**从 RxJS Observable 迁移到 Signals**

```typescript
// 之前
export class MyComponent implements OnInit {
  data$ = this.service.getData();
  data: any;

  constructor(private service: MyService) {}

  ngOnInit() {
    this.data$.subscribe(d => this.data = d);
  }
}

// 之后
import { toSignal } from '@angular/core/rxjs-interop';

export class MyComponent {
  private service = inject(MyService);

  data = toSignal(this.service.getData(), { initialValue: null });
}
```

#### 验证步骤
每个组件迁移后：
1. 运行单元测试
2. 运行 `ng build` 检查编译错误
3. 手动测试组件功能
4. 提交代码并注明迁移的组件

---

### 阶段 4: 表单组件迁移 (预计 3-4 天)

#### 目标
迁移 Reactive Forms 到 Signal Forms（如果可用）或确保与 Zoneless 兼容。

#### 需要修改的文件

##### 带表单的组件 (136 个文件)

重点迁移（常用表单）：

1. **src/app/components/login/login.component.ts**
   - 确保表单更新触发变更检测
   - 连接 form observables 到 `ChangeDetectorRef.markForCheck()`

2. **src/app/components/user-management/add-user-dialog/add-user-dialog.component.ts**
   - 迁移表单验证状态为 signals

3. **src/app/components/user-management/edit-user-dialog/edit-user-dialog.component.ts**

4. **src/app/components/controllers/add-controller-dialog/add-controller-dialog.component.ts**

5. **src/app/components/projects/add-blank-project-dialog/add-blank-project-dialog.component.ts**

6. **所有配置对话框** (preferences 目录下)
   - qemu, docker, virtualbox, vmware 等配置对话框

#### Zoneless 表单处理模式

```typescript
export class MyFormComponent implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private cdr = inject(ChangeDetectorRef);

  form = this.formBuilder.group({
    name: [''],
    email: ['']
  });

  ngOnInit() {
    // 监听表单变化并标记需要变更检测
    this.form.valueChanges.subscribe(() => {
      this.cdr.markForCheck();
    });
  }
}
```

---

### 阶段 5: 服务层迁移 (预计 4-5 天)

#### 目标
将服务中的 Observable 模式优化为 Signals（在合适的地方）。

#### 需要迁移的服务

##### 状态管理服务 (优先)

1. **src/app/services/settings.service.ts**
   - 将设置状态转换为 signals
   - 提供 computed getters

2. **src/app/services/theme.service.ts**
   - 将主题状态转换为 signal
   - 使用 `effect()` 处理主题切换副作用

3. **src/app/services/tools.service.ts**
   - 将工具状态转换为 signals

4. **src/app/services/mapScale.service.ts**
   - 迁移缩放状态为 signals

5. **src/app/services/mapsettings.service.ts**
   - 迁移地图设置状态为 signals

##### HTTP 服务 (中优先)

6. **src/app/services/project.service.ts**
   - HTTP 调用保持 Observable（用于 `async` pipe）
   - 本地缓存使用 signals

7. **src/app/services/template.service.ts**
8. **src/app/services/node.service.ts**
9. **src/app/services/link.service.ts**
10. **src/app/services/snapshot.service.ts**
...

#### 服务迁移模式

```typescript
// 之前
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settingsSubject = new BehaviorSubject<Settings>(defaultSettings);
  settings$ = this.settingsSubject.asObservable();

  updateSettings(settings: Partial<Settings>) {
    const current = this.settingsSubject.value;
    this.settingsSubject.next({ ...current, ...settings });
  }
}

// 之后
import { signal, computed, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settings = signal<Settings>(defaultSettings);

  // 暴露为只读 signal
  settings = computed(() => this.settings());

  updateSettings(newSettings: Partial<Settings>) {
    this.settings.update(current => ({ ...current, ...newSettings }));
  }

  // Computed getters
  theme = computed(() => this.settings().theme);
  language = computed(() => this.settings().language);
}
```

---

### 阶段 6: 添加 OnPush 策略 (预计 3-4 天)

#### 目标
为所有组件添加 `ChangeDetectionStrategy.OnPush`。

#### 需要修改的文件

所有组件文件 (253 个) - 可以分批进行

**批处理策略**:
- 按目录分批
- 每批 20-30 个组件
- 每批完成后测试

```typescript
@Component({
  standalone: true,
  selector: 'app-my-component',
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,  // 添加这行
  imports: [...]
})
```

#### 优先级
1. 高频更新组件（地图、控制台、日志）
2. 列表组件
3. 表单组件
4. 对话框组件
5. 静态组件

---

### 阶段 7: 优化和调试 (预计 2-3 天)

#### 任务清单

1. **添加开发时检查**
   - 在 `src/main.ts` 中添加 `provideCheckNoChangesConfig({ exhaustive: true })`
   - 设置合理的检查间隔

2. **性能优化**
   - 移除不必要的 `detectChanges()` 调用
   - 优化 `effect()` 使用
   - 减少不必要的 computed signals

3. **内存泄漏检查**
   - 确保所有 `effect()` 正确清理
   - 检查订阅是否正确取消

4. **代码审查**
   - 检查是否有遗漏的 `@Input`/`@Output`
   - 确保没有使用 `NgZone`
   - 验证所有组件使用 `OnPush`

---

### 阶段 8: 测试和验证 (预计 2-3 天)

#### 测试清单

1. **单元测试**
   - 所有现有测试必须通过
   - 更新使用 `fixture.detectChanges()` 的测试
   - 添加 signals 相关测试

2. **集成测试**
   - 测试主要用户流程
   - 验证状态更新正确触发

3. **性能测试**
   - 对比迁移前后的 Lighthouse 分数
   - 测量包体积减小
   - 测试内存使用

4. **回归测试**
   - 手动测试所有核心功能
   - 检查是否有 UI 不更新的问题

---

## 需要修改的文件清单

### 按类型分类

#### 配置文件 (5 个)
1. `src/polyfills.ts` - 移除 zone.js 导入
2. `src/main.ts` - 启用 zoneless bootstrap
3. `src/app/app.module.ts` - 转换为配置
4. `src/test.ts` - 更新测试配置
5. `angular.json` - 移除 zone.js polyfills

#### 核心组件 (10 个)
1. `src/app/app.component.ts`
2. `src/app/components/project-map/project-map.component.ts`
3. `src/cartography/components/d3-map/d3-map.component.ts`
4. `src/layouts/default-layout/default-layout.component.ts`
5. `src/app/components/project-map/new-template-dialog/new-template-dialog.component.ts`
6. `src/app/components/projects/projects.component.ts`
7. `src/app/components/template/template.component.ts`
8. `src/app/components/project-map/console-wrapper/console-wrapper.component.ts`
9. `src/app/components/project-map/ai-chat/ai-chat.component.ts`
10. `src/app/components/settings/settings.component.ts`

#### NgZone 使用 (5 个)
1. `src/app/services/toaster.service.ts`
2. `src/app/services/xterm-context-menu.service.ts`
3. `src/app/components/project-map/project-map.component.ts`
4. `src/app/components/controllers/controllers.component.ts`
5. `src/app/cartography/components/text-editor/text-editor.component.ts`

#### 服务层 (约 80 个)
状态管理相关（优先）:
- `src/app/services/settings.service.ts`
- `src/app/services/theme.service.ts`
- `src/app/services/tools.service.ts`
- `src/app/services/mapScale.service.ts`
- `src/app/services/mapsettings.service.ts`
- `src/app/services/progress.service.ts`

HTTP 服务:
- `src/app/services/project.service.ts`
- `src/app/services/template.service.ts`
- `src/app/services/node.service.ts`
- `src/app/services/link.service.ts`
- `src/app/services/snapshot.service.ts`
- `src/app/services/controller.service.ts`
- `src/app/services/user.service.ts`
- `src/app/services/group.service.ts`
- `src/app/services/role.service.ts`
- `src/app/services/acl.service.ts`
- ... (约 70 个其他服务)

#### 表单组件 (136 个)
所有包含 `ReactiveFormsModule` 或 `FormsModule` 的组件，主要分布在:
- `src/app/components/preferences/` - 约 40 个
- `src/app/components/project-map/node-editors/` - 约 30 个
- `src/app/components/user-management/` - 约 10 个
- `src/app/components/group-management/` - 约 8 个
- `src/app/components/role-management/` - 约 6 个
- `src/app/components/projects/` - 约 10 个
- 其他对话框和表单组件

#### 使用 @Input/@Output 的组件 (111 个)
所有使用 `@Input()` 或 `@Output()` 装饰器的组件需要迁移

#### 需要添加 OnPush 的组件 (约 200 个)
所有未使用 `ChangeDetectionStrategy.OnPush` 的组件

### 按优先级分类

#### P0 - 必须迁移 (阻塞 zoneless)
1. `src/polyfills.ts`
2. `src/main.ts`
3. `src/app/app.module.ts`
4. 所有 5 个 `NgZone` 使用

#### P1 - 核心功能 (高优先级)
1. 核心组件 (10 个)
2. 状态管理服务 (约 10 个)

#### P2 - 常用功能 (中优先级)
1. 表单组件 (约 50 个常用表单)
2. HTTP 服务 (约 20 个)

#### P3 - 边缘功能 (低优先级)
1. 边缘表单组件 (约 80 个)
2. 辅助服务 (约 50 个)
3. 添加 OnPush 到所有组件

---

## 风险识别与缓解

### 高风险

#### 1. D3.js 地图组件不更新
**风险描述**: `project-map.component.ts` 和 `d3-map.component.ts` 是核心组件，使用 D3.js 直接操作 DOM，可能在 zoneless 模式下不触发更新。

**缓解措施**:
- 在 D3.js 回调中显式调用 `ChangeDetectorRef.markForCheck()`
- 将 D3.js 相关状态转换为 signals
- 充分测试地图交互（拖拽、缩放、节点操作）

#### 2. WebSocket 实时数据不更新
**风险描述**: 项目使用 WebSocket 获取实时更新，可能不会触发变更检测。

**缓解措施**:
- 在 WebSocket 消息处理中调用 `markForCheck()`
- 或将 WebSocket 状态转换为 signals

#### 3. 第三方库不兼容
**风险描述**: 某些第三方库可能依赖 ZoneJS。

**缓解措施**:
- 检查以下库的兼容性:
  - `ng2-file-upload`
  - `angular-draggable-droppable`
  - `xterm`
- 如有问题，在库的回调中使用 `NgZone.run()` (但 NgZone 在 zoneless 中仍可用)

### 中风险

#### 4. 表单验证状态不更新
**风险描述**: Reactive Forms 的验证状态可能不会自动触发更新。

**缓解措施**:
- 监听 `form.valueChanges` 并调用 `markForCheck()`
- 或使用 Signal Forms（如果 Angular 21+ 稳定）

#### 5. 路由导航后视图不更新
**风险描述**: 路由参数变化可能不触发组件更新。

**缓解措施**:
- 使用 `toSignal()` 包装 `ActivatedRoute.params`
- 确保路由相关状态是 signals

#### 6. 测试大规模失败
**风险描述**: 移除 zone.js 后，许多测试可能失败。

**缓解措施**:
- 分批更新测试
- 在 `TestBed` 中提供 `provideZonelessChangeDetection()`
- 使用 `fixture.whenStable()` 替代 `fixture.detectChanges()`

### 低风险

#### 7. 性能回归
**风险描述**: 不当使用 signals 可能导致性能下降。

**缓解措施**:
- 建立性能基准
- 使用 Angular DevTools 进行性能分析
- 避免过度使用 `effect()`

#### 8. 学习曲线
**风险描述**: 团队可能不熟悉 signals API。

**缓解措施**:
- 提供团队培训
- 编写迁移指南
- 代码审查确保正确使用

---

## 测试策略

### 单元测试

#### 更新策略
1. **移除 `fixture.detectChanges()`**
   - 优先使用 `fixture.whenStable()`
   - 让 signals 自动触发更新

2. **测试 signals**
   ```typescript
   it('should update signal value', () => {
     const component = fixture.componentInstance;
     expect(component.data()).toBe('initial');
     component.data.set('updated');
     fixture.whenStable().then(() => {
       expect(component.data()).toBe('updated');
     });
   });
   ```

3. **测试 computed signals**
   ```typescript
   it('should compute derived value', () => {
     const component = fixture.componentInstance;
     component.source.set('test');
     expect(component.derived()).toBe('TEST');
   });
   ```

### 集成测试

#### 关键流程
1. 项目创建和打开
2. 节点添加和配置
3. 链接创建
4. 控制台连接
5. 快照创建和恢复
6. 导出/导入项目

### 性能测试

#### 指标
1. **Lighthouse 分数**
   - Performance
   - FID (First Input Delay)
   - LCP (Largest Contentful Paint)

2. **包体积**
   - main.js 大小
   - total bundle 大小
   - 减少幅度预期: 80-120KB (zone.js 大小)

3. **运行时性能**
   - 大型项目加载时间
   - 地图交互响应时间
   - 内存使用

### 回归测试

#### 测试矩阵
| 功能模块 | 测试场景 | 预期结果 |
|---------|---------|---------|
| 项目管理 | 创建、打开、保存、删除项目 | 正常工作 |
| 节点操作 | 拖拽、配置、启动、停止节点 | 视图正确更新 |
| 链接操作 | 创建、删除、捕获流量 | 视图正确更新 |
| 控制台 | 打开、关闭、发送命令 | 实时更新 |
| 设置 | 修改主题、语言等 | 立即生效 |
| 表单 | 填写、验证、提交 | 验证状态正确显示 |

---

## 回滚计划

### 触发条件
如果出现以下情况，考虑回滚：
1. 核心功能严重损坏且无法快速修复
2. 性能显著下降（>20%）
3. 大量用户反馈严重问题
4. 安全漏洞

### 回滚步骤
1. **回滚代码**
   ```bash
   git revert <migration-commit-range>
   git push
   ```

2. **恢复依赖**
   ```bash
   npm install zone.js
   ```

3. **验证**
   - 运行测试套件
   - 手动验证核心功能

4. **分析失败原因**
   - 记录问题
   - 更新迁移计划
   - 准备下次迁移

### 预防措施
- 分阶段迁移，每阶段完成后合并到主分支
- 保留迁移前的完整备份
- 使用功能开关控制新特性（如果可能）

---

## 附录

### A. 有用的 Angular CLI 命令

```bash
# 启用 zoneless 迁移检查
ng g @angular/core:zoneless

# 检查组件是否与 zoneless 兼容
ng g @angular/core:on-push

# 性能分析
ng build --stats-json
# 然后使用 https://webpack.github.io/analyse 或 webpack-bundle-analyzer
```

### B. 参考资源

- [Angular Zoneless Guide](https://angular.dev/guide/zoneless)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Signal Forms Migration](https://angular.dev/guide/forms/signals/migration)
- [RxJS Interop](https://angular.dev/ecosystem/rxjs-interop)

### C. 迁移检查清单模板

```markdown
## [组件名] 迁移检查清单

### 迁移前
- [ ] 记录组件功能
- [ ] 记录所有 @Input 和 @Output
- [ ] 记录所有 Observable 订阅
- [ ] 编写/更新测试

### 迁移中
- [ ] 将 @Input 转换为 input()
- [ ] 将 @Output 转换为 output()
- [ ] 将本地状态转换为 signals
- [ ] 将 Observable 转换为 signals (使用 toSignal)
- [ ] 添加 ChangeDetectionStrategy.OnPush
- [ ] 移除不必要的 ChangeDetectorRef 调用

### 迁移后
- [ ] 运行单元测试
- [ ] 手动测试组件功能
- [ ] 检查控制台无错误
- [ ] 验证性能无回归
- [ ] 代码审查
- [ ] 提交代码
```

### D. 估计工作量

| 阶段 | 预计时间 | 并行度 |
|-----|---------|-------|
| 阶段 0: 准备 | 2-3 天 | 1 人 |
| 阶段 1: NgZone 清理 | 3-5 天 | 1-2 人 |
| 阶段 2: 启用 Zoneless | 1-2 天 | 1 人 |
| 阶段 3: 核心组件 | 5-7 天 | 2-3 人 |
| 阶段 4: 表单组件 | 3-4 天 | 2-3 人 |
| 阶段 5: 服务层 | 4-5 天 | 2-3 人 |
| 阶段 6: OnPush 策略 | 3-4 天 | 2-3 人 |
| 阶段 7: 优化调试 | 2-3 天 | 1-2 人 |
| 阶段 8: 测试验证 | 2-3 天 | 全员 |
| **总计** | **25-36 天** | - |

**注意**: 实际时间取决于团队规模、经验和项目复杂度。建议预留 30-40% 的缓冲时间。

---

## 结论

本迁移计划提供了从当前基于 ZoneJS 的架构迁移到 Zoneless + Signals 架构的完整路径。建议：

1. **分阶段执行**: 不要一次性迁移所有代码
2. **持续测试**: 每个阶段完成后都要验证功能
3. **保持沟通**: 定期分享进度和遇到的问题
4. **灵活调整**: 根据实际情况调整优先级和时间表

迁移完成后，预期获得：
- 更小的包体积（减少 80-120KB）
- 更好的运行时性能
- 更简洁的代码
- 更好的类型安全
- 更容易维护的状态管理

祝迁移顺利！
