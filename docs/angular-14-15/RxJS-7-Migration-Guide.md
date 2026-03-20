# GNS3 Web UI - Angular 14 到 15 升级指南

## RxJS 6 → 7 迁移详细文档

**项目版本**: GNS3 Web UI 3.1.0-dev.1
**当前 Angular**: 14.3.0
**目标 Angular**: 15.x
**当前 RxJS**: 6.6.7
**目标 RxJS**: 7.5.0+

**创建日期**: 2026-03-20
**负责人**: Frontend Team

---

## 📋 目录

1. [升级概述](#升级概述)
2. [修改文件总览](#修改文件总览)
3. [详细修改清单](#详细修改清单)
4. [代码示例](#代码示例)
5. [升级步骤](#升级步骤)
6. [测试验证](#测试验证)

---

## 升级概述

### 主要变更

RxJS 7 是一个主要版本更新，包含以下破坏性变更：

1. **throwError 签名变更** - 必须传入工厂函数
2. **静态方法不再使用 Observable. 前缀** - 使用独立导入
3. **类型检查更严格** - 需要明确的类型定义
4. **不再支持 rxjs-compat** - 必须移除此依赖

### 影响范围统计

| 类型 | 文件数量 | 修改次数 |
|------|----------|----------|
| throwError 修改 | 3 | 3 |
| Observable. 前缀移除 | 8 | 20+ |
| 测试文件修改 | ~20 | ~30 |
| **总计** | **~31** | **~50+** |

---

## 修改文件总览

### 一、必须修改的文件（高优先级）

| # | 文件路径 | 问题类型 | 影响等级 |
|---|----------|----------|----------|
| 1 | `src/app/interceptors/http.interceptor.ts` | throwError 参数 | 🔴 高 |
| 2 | `src/app/services/http-controller.service.ts` | throwError 参数 | 🔴 高 |
| 3 | `src/app/services/ai-chat.service.ts` | throwError 参数 | 🔴 高 |
| 4 | `src/app/services/resource-pools.service.ts` | Observable.forkJoin | 🔴 高 |
| 5 | `src/app/components/controllers/controller-discovery/controller-discovery.component.ts` | Observable.of, flatMap | 🟡 中 |
| 6 | `src/app/components/projects/confirmation-delete-all-projects/confirmation-delete-all-projects.component.ts` | Observable.forkJoin | 🟡 中 |
| 7 | `src/app/components/image-manager/deleteallfiles-dialog/deleteallfiles-dialog.component.ts` | Observable.forkJoin | 🟡 中 |
| 8 | `src/app/cartography/components/experimental-map/draggable/draggable.component.ts` | Observable.fromEvent, combineLatest | 🟡 中 |
| 9 | `src/app/cartography/components/experimental-map/selection/selection.component.ts` | Observable.fromEvent, combineLatest | 🟡 中 |
| 10 | `src/app/components/user-management/user-detail/ai-profile-tab/ai-profile-tab.component.ts` | combineLatest 导入 | 🟢 低 |

---

## 详细修改清单

### 🔴 高优先级修改（必须完成）

#### 1. src/app/interceptors/http.interceptor.ts

**问题**: throwError 使用旧式 API

**位置**: 第 14 行

**修改前**:
```typescript
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpRequestsInterceptor implements HttpInterceptor {
  constructor(private controllerService: ControllerService, private loginService: LoginService) {}

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(httpRequest).pipe(
      catchError((err) => {
        return throwError(err);  // ❌ RxJS 6 写法
      })
    );
  }
}
```

**修改后**:
```typescript
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpRequestsInterceptor implements HttpInterceptor {
  constructor(private controllerService: ControllerService, private loginService: LoginService) {}

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(httpRequest).pipe(
      catchError((err) => {
        return throwError(() => err);  // ✅ RxJS 7 写法
      })
    );
  }
}
```

**变更说明**:
- `throwError(err)` → `throwError(() => err)`
- 必须传入返回错误对象的工厂函数

---

#### 2. src/app/services/http-controller.service.ts

**问题**: throwError 使用旧式 API

**位置**: 第 96 行

**修改前**:
```typescript
return throwError(err);  // ❌
```

**修改后**:
```typescript
return throwError(() => err);  // ✅
```

---

#### 3. src/app/services/ai-chat.service.ts

**问题**: 混合使用新旧 throwError API

**位置**: 第 180, 200 行

**修改前**:
```typescript
// 第 180 行
catchError(error => {
  this.isStreaming.next(false);
  return throwError(error);  // ❌
})

// 第 200 行
catchError(error => {
  console.error('Failed to get sessions:', error);
  return throwError(error);  // ❌
})
```

**修改后**:
```typescript
// 第 180 行
catchError(error => {
  this.isStreaming.next(false);
  return throwError(() => error);  // ✅
})

// 第 200 行
catchError(error => {
  console.error('Failed to get sessions:', error);
  return throwError(() => error);  // ✅
})
```

**注意**: 第 228, 257, 281, 306, 330 行已经使用了正确的 API，无需修改。

---

#### 4. src/app/services/resource-pools.service.ts

**问题**: 使用 Observable.forkJoin 前缀

**位置**: 第 25, 69 行

**修改前**:
```typescript
import {Observable, of} from "rxjs";
import {filter, map, mergeAll, switchMap, tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ResourcePoolsService {

  get(controller: Controller, poolId: string): Observable<ResourcePool> {
    return Observable.forkJoin([  // ❌ 使用前缀
      this.httpController.get<ResourcePool>(controller, `/pools/${poolId}`),
      this.httpController.get<Resource[]>(controller, `/pools/${poolId}/resources`),
    ]).pipe(map(results => {
      results[0].resources = results[1];
      return results[0];
    }));
  }

  private getAllNonFreeResources(controller: Controller) {
    return this.getAll(controller)
      .pipe(switchMap((resourcesPools) => {
        return Observable.forkJoin(  // ❌ 使用前缀
          resourcesPools.map((r) => this.httpController.get<Resource[]>(controller, `/pools/${r.resource_pool_id}/resources`),)
        )
      }),
      // ...
  }
}
```

**修改后**:
```typescript
import { Observable, of, forkJoin } from "rxjs";  // ✅ 添加 forkJoin 导入
import {filter, map, mergeAll, switchMap, tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ResourcePoolsService {

  get(controller: Controller, poolId: string): Observable<ResourcePool> {
    return forkJoin([  // ✅ 直接使用
      this.httpController.get<ResourcePool>(controller, `/pools/${poolId}`),
      this.httpController.get<Resource[]>(controller, `/pools/${poolId}/resources`),
    ]).pipe(map(results => {
      results[0].resources = results[1];
      return results[0];
    }));
  }

  private getAllNonFreeResources(controller: Controller) {
    return this.getAll(controller)
      .pipe(switchMap((resourcesPools) => {
        return forkJoin(  // ✅ 直接使用
          resourcesPools.map((r) => this.httpController.get<Resource[]>(controller, `/pools/${r.resource_pool_id}/resources`),)
        )
      }),
      // ...
  }
}
```

**变更说明**:
- 导入添加 `forkJoin`
- `Observable.forkJoin` → `forkJoin`

---

### 🟡 中优先级修改（推荐完成）

#### 5. src/app/components/controllers/controller-discovery/controller-discovery.component.ts

**问题**:
1. 使用 Observable.of
2. 使用 flatMap（建议改为 mergeMap）

**位置**: 第 95, 112 行

**修改前**:
```typescript
import { Observable } from 'rxjs';

// 第 95 行
return Observable.of(null);  // ❌

// 第 112 行
return this.versionService.get(controller).flatMap((version: Version) => Observable.of(controller));  // ❌
```

**修改后**:
```typescript
import { of } from 'rxjs';

// 第 95 行
return of(null);  // ✅

// 第 112 行
return this.versionService.get(controller).pipe(
  mergeMap((version: Version) => of(controller))  // ✅ 使用 pipe + mergeMap + of
);
```

**变更说明**:
- `Observable.of(null)` → `of(null)`
- `flatMap` → `mergeMap`（flatMap 是 mergeMap 的别名，但 mergeMap 更明确）
- 使用 `.pipe()` 语法更一致

---

#### 6. src/app/components/projects/confirmation-delete-all-projects/confirmation-delete-all-projects.component.ts

**问题**: 使用 Observable.forkJoin

**位置**: 第 39 行

**修改前**:
```typescript
import { Observable } from 'rxjs';

Observable.forkJoin(calls).subscribe(responses => {
  // ...
});
```

**修改后**:
```typescript
import { forkJoin } from 'rxjs';

forkJoin(calls).subscribe(responses => {
  // ...
});
```

---

#### 7. src/app/components/image-manager/deleteallfiles-dialog/deleteallfiles-dialog.component.ts

**问题**: 使用 Observable.forkJoin

**位置**: 第 40 行

**修改前**:
```typescript
import { Observable } from 'rxjs';

Observable.forkJoin(calls).subscribe(responses => {
  // ...
});
```

**修改后**:
```typescript
import { forkJoin } from 'rxjs';

forkJoin(calls).subscribe(responses => {
  // ...
});
```

---

#### 8. src/app/cartography/components/experimental-map/draggable/draggable.component.ts

**问题**:
1. 使用 Observable.fromEvent
2. 使用 .do() 操作符（RxJS 7 中改为 tap）
3. 使用 Observable.combineLatest

**位置**: 第 32, 44, 48, 50, 52 行

**修改前**:
```typescript
import { Observable } from 'rxjs';
import 'rxjs/add/operator/do';

const down = Observable.fromEvent(this.elementRef.nativeElement, 'mousedown')
  .do((e: MouseEvent) => e.preventDefault());  // ❌ 使用 .do()

const up = Observable.fromEvent(document, 'mouseup')
  .do((e: MouseEvent) => {
    // ...
  });

const mouseMove = Observable.fromEvent(document, 'mousemove')
  .do((e: MouseEvent) => e.stopPropagation());

const scrollWindow = Observable.fromEvent(document, 'scroll')
  .startWith({});  // ⚠️ startWith 应该在 pipe 中

const move = Observable.combineLatest(mouseMove, scrollWindow);  // ❌ 多参数形式
```

**修改后**:
```typescript
import { fromEvent, combineLatest } from 'rxjs';
import { tap, startWith } from 'rxjs/operators';

const down = fromEvent(this.elementRef.nativeElement, 'mousedown').pipe(
  tap((e: MouseEvent) => e.preventDefault())  // ✅ 使用 tap
);

const up = fromEvent(document, 'mouseup').pipe(
  tap((e: MouseEvent) => {
    // ...
  })
);

const mouseMove = fromEvent(document, 'mousemove').pipe(
  tap((e: MouseEvent) => e.stopPropagation())
);

const scrollWindow = fromEvent(document, 'scroll').pipe(
  startWith({})  // ✅ 在 pipe 中使用
);

const move = combineLatest([mouseMove, scrollWindow]);  // ✅ 使用数组形式
```

**变更说明**:
- `Observable.fromEvent` → `fromEvent`
- `.do()` → `.pipe(tap())`
- `.startWith()` 移入 `.pipe()`
- `combineLatest(a, b)` → `combineLatest([a, b])`

---

#### 9. src/app/cartography/components/experimental-map/selection/selection.component.ts

**问题**: 同 draggable.component.ts

**位置**: 第 30, 45, 49, 51, 53 行

**修改前**:
```typescript
import { Observable } from 'rxjs';

const down = Observable.fromEvent(this.svg, 'mousedown')
  .do((e: MouseEvent) => e.preventDefault());

const up = Observable.fromEvent(document, 'mouseup')
  .do((e: MouseEvent) => {
    // ...
  });

const mouseMove = Observable.fromEvent(document, 'mousemove')
  .do((e: MouseEvent) => e.stopPropagation());

const scrollWindow = Observable.fromEvent(document, 'scroll')
  .startWith({});

const move = Observable.combineLatest([mouseMove, scrollWindow]);
```

**修改后**:
```typescript
import { fromEvent, combineLatest } from 'rxjs';
import { tap, startWith } from 'rxjs/operators';

const down = fromEvent(this.svg, 'mousedown').pipe(
  tap((e: MouseEvent) => e.preventDefault())
);

const up = fromEvent(document, 'mouseup').pipe(
  tap((e: MouseEvent) => {
    // ...
  })
);

const mouseMove = fromEvent(document, 'mousemove').pipe(
  tap((e: MouseEvent) => e.stopPropagation())
);

const scrollWindow = fromEvent(document, 'scroll').pipe(
  startWith({})
);

const move = combineLatest([mouseMove, scrollWindow]);
```

---

### 🟢 低优先级修改（可选）

#### 10. src/app/components/user-management/user-detail/ai-profile-tab/ai-profile-tab.component.ts

**问题**: combineLatest 导入可能需要检查

**位置**: 第 57 行

**当前代码**（已经正确）:
```typescript
// 第 57 行 - 已经使用数组形式
combineLatest([
  this.configs$,
  this.defaultConfig$
])
```

**检查导入**:
```typescript
// 确保导入正确
import { combineLatest } from 'rxjs';

// 而不是
// import { Observable } from 'rxjs';
// 使用 Observable.combineLatest
```

---

## 测试文件修改

### 测试文件修改清单

| # | 文件路径 | 问题类型 |
|---|----------|----------|
| 1 | `src/app/components/controllers/controller-discovery/controller-discovery.component.spec.ts` | Observable.throwError |
| 2 | `src/app/components/drawings-listeners/text-edited/text-edited.component.spec.ts` | Observable.of |
| 3 | `src/app/components/drawings-listeners/text-added/text-added.component.spec.ts` | Observable.of |
| 4 | `src/app/components/drawings-listeners/node-label-dragged/node-label-dragged.component.spec.ts` | Observable.of |
| 5 | 其他 ~20 个 .spec.ts 文件 | Observable.of, Observable.throwError |

### 通用修改模式

#### Observable.of 修改

**修改前**:
```typescript
spyOn(service, 'method').and.returnValue(Observable.of(value));
```

**修改后**:
```typescript
import { of } from 'rxjs';

spyOn(service, 'method').and.returnValue(of(value));
```

#### Observable.throwError 修改

**修改前**:
```typescript
spyOn(service, 'method').and.returnValue(Observable.throwError(error));
```

**修改后**:
```typescript
import { throwError } from 'rxjs';

spyOn(service, 'method').and.returnValue(throwError(() => error));
```

#### new Observable() 修改

**修改前**:
```typescript
httpClientSpy.get.and.returnValue(new Observable());
```

**修改后**:
```typescript
import { EMPTY } from 'rxjs';

httpClientSpy.get.and.returnValue(EMPTY);
// 或
import { of } from 'rxjs';
httpClientSpy.get.and.returnValue(of());
```

---

## 代码示例

### 完整文件修改示例

#### 示例 1: HTTP 拦截器完整修改

**文件**: `src/app/interceptors/http.interceptor.ts`

```typescript
/**
 * HTTP Interceptor - RxJS 7 兼容版本
 */

import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoginService } from '@services/login.service';
import { ControllerService } from '@services/controller.service';

@Injectable()
export class HttpRequestsInterceptor implements HttpInterceptor {
  constructor(
    private controllerService: ControllerService,
    private loginService: LoginService
  ) {}

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(httpRequest).pipe(
      catchError((err) => {
        // ✅ RxJS 7: 使用工厂函数
        return throwError(() => err);
      })
    );
  }

  async call() {
    let getCurrentUser = JSON.parse(localStorage.getItem(`isRememberMe`)) ?? null;
    const controller_id = this.loginService.controller_id;
    let controller = await this.controllerService.get(parseInt(controller_id, 10));
    controller.tokenExpired = true;
    await this.controllerService.update(controller);
    try {
      if (getCurrentUser && getCurrentUser.isRememberMe) {
        let response = await this.loginService.getLoggedUserRefToken(controller, getCurrentUser);
        controller.authToken = response.access_token;
        controller.tokenExpired = false;
        await this.controllerService.update(controller);
        await this.loginService.getLoggedUser(controller);
        this.reloadCurrentRoute();
      }
    } catch (e) {
      throw e;
    }
  }

  reloadCurrentRoute() {
    location.reload();
  }
}
```

---

#### 示例 2: 服务类完整修改

**文件**: `src/app/services/resource-pools.service.ts`

```typescript
/**
 * Resource Pools Service - RxJS 7 兼容版本
 */

import { Injectable } from '@angular/core';
import { Controller } from "@models/controller";
import { Observable, of, forkJoin } from "rxjs";  // ✅ 添加 forkJoin
import { ResourcePool } from "@models/resourcePools/ResourcePool";
import { HttpController } from "@services/http-controller.service";
import { Resource } from "@models/resourcePools/Resource";
import { filter, map, mergeAll, switchMap, tap } from "rxjs/operators";
import { Project } from "@models/project";
import { ProjectService } from "@services/project.service";

@Injectable({
  providedIn: 'root'
})
export class ResourcePoolsService {

  constructor(
    private httpController: HttpController,
    private projectService: ProjectService
  ) {}

  getAll(controller: Controller) {
    return this.httpController.get<ResourcePool[]>(controller, '/pools');
  }

  get(controller: Controller, poolId: string): Observable<ResourcePool> {
    // ✅ 使用 forkJoin 而不是 Observable.forkJoin
    return forkJoin([
      this.httpController.get<ResourcePool>(controller, `/pools/${poolId}`),
      this.httpController.get<Resource[]>(controller, `/pools/${poolId}/resources`),
    ]).pipe(
      map(results => {
        results[0].resources = results[1];
        return results[0];
      })
    );
  }

  delete(controller: Controller, uuid: string) {
    return this.httpController.delete(controller, `/pools/${uuid}`);
  }

  add(controller: Controller, newPoolName: string) {
    return this.httpController.post<{ name: string }>(controller, '/pools', { name: newPoolName });
  }

  update(controller: Controller, pool: ResourcePool) {
    return this.httpController.put(controller, `/pools/${pool.resource_pool_id}`, { name: pool.name });
  }

  addResource(controller: Controller, pool: ResourcePool, project: Project) {
    return this.httpController.put<string>(
      controller,
      `/pools/${pool.resource_pool_id}/resources/${project.project_id}`,
      {}
    );
  }

  deleteResource(controller: Controller, resource: Resource, pool: ResourcePool) {
    return this.httpController.delete<string>(
      controller,
      `/pools/${pool.resource_pool_id}/resources/${resource.resource_id}`
    );
  }

  getFreeResources(controller: Controller) {
    return this.projectService
      .list(controller)
      .pipe(
        switchMap((projects) => {
          return this.getAllNonFreeResources(controller)
            .pipe(
              map(resources => resources.map(resource => resource.resource_id)),
              map(resources_id => projects.filter(project => !resources_id.includes(project.project_id)))
            )
        });
      );
  }

  private getAllNonFreeResources(controller: Controller) {
    return this.getAll(controller)
      .pipe(
        switchMap((resourcesPools) => {
          // ✅ 使用 forkJoin 而不是 Observable.forkJoin
          return forkJoin(
            resourcesPools.map((r) =>
              this.httpController.get<Resource[]>(controller, `/pools/${r.resource_pool_id}/resources`)
            )
          );
        }),
        map((data) => {
          // flatten results
          const output: Resource[] = [];
          for (const res of data) {
            for (const r of res) {
              output.push(r);
            }
          }
          return output;
        })
      );
  }
}
```

---

#### 示例 3: 组件完整修改

**文件**: `src/app/cartography/components/experimental-map/selection/selection.component.ts`

```typescript
/**
 * Selection Component - RxJS 7 兼容版本
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Observable, fromEvent, combineLatest } from 'rxjs';  // ✅ 修改导入
import { tap, startWith, mergeMap } from 'rxjs/operators';  // ✅ 添加 tap, startWith

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {

  @ViewChild('svg')
  svg: ElementRef;

  constructor() { }

  ngOnInit() {
    this.initializeSelection();
  }

  private initializeSelection() {
    // ✅ 使用 fromEvent 而不是 Observable.fromEvent
    const down = fromEvent(this.svg.nativeElement, 'mousedown').pipe(
      tap((e: MouseEvent) => e.preventDefault())  // ✅ 使用 tap 而不是 .do()
    );

    const up = fromEvent(document, 'mouseup').pipe(
      tap((e: MouseEvent) => {
        // handle mouse up
      })
    );

    const mouseMove = fromEvent(document, 'mousemove').pipe(
      tap((e: MouseEvent) => e.stopPropagation())
    );

    const scrollWindow = fromEvent(document, 'scroll').pipe(
      startWith({})  // ✅ 在 pipe 中使用 startWith
    );

    // ✅ 使用数组形式的 combineLatest
    const move = combineLatest([mouseMove, scrollWindow]);

    const drag = down.pipe(
      mergeMap((md: MouseEvent) => {
        // handle drag
        return move;
      })
    );

    // subscribe to drag
    drag.subscribe(/* ... */);
  }
}
```

---

## 升级步骤

### 第一步：创建升级分支

```bash
cd /home/yueguobin/myCode/GNS3/gns3-web-ui
git checkout -b upgrade/angular-15-rxjs-7
```

### 第二步：备份当前版本

```bash
# 创建备份标签
git tag pre-rxjs7-upgrade

# 或创建备份分支
git branch backup/pre-rxjs7-upgrade
```

### 第三步：升级依赖

```bash
# 升级到 RxJS 7
npm install rxjs@^7.5.0

# 卸载 rxjs-compat（不再需要）
npm uninstall rxjs-compat

# 清理缓存
npm cache clean --force
```

### 第四步：运行自动迁移工具

```bash
# 安装 rxjs-tslint（如果尚未安装）
npm install rxjs-tslint --save-dev

# 运行自动迁移
npx rxjs-tslint -p tsconfig.base.json

# 查看生成的迁移规则
cat rxjs-migration.json
```

### 第五步：应用代码修改

按照上述详细清单，逐个文件进行修改：

1. **高优先级文件**（必须修改）
   ```bash
   # 修改拦截器
   # 修改服务类
   # 修改关键组件
   ```

2. **中优先级文件**（推荐修改）
   ```bash
   # 修改实验性组件
   # 修改其他组件
   ```

3. **测试文件**（可选，但推荐）
   ```bash
   # 批量修改测试文件
   find src -name "*.spec.ts" -type f -exec sed -i 's/Observable\.of(/of(/g' {} +
   find src -name "*.spec.ts" -type f -exec sed -i 's/Observable\.throwError(/throwError(() => /g' {} +
   ```

### 第六步：修复编译错误

```bash
# 编译检查
npm run build

# 查看错误并修复
# 常见错误：
# - 找不到模块 -> 检查导入语句
# - 类型不匹配 -> 添加类型断言
# - 缺少参数 -> 检查函数签名
```

### 第七步：运行测试

```bash
# 运行单元测试
npm test

# 运行 e2e 测试
npm run e2e

# 检查测试覆盖率
npm run coverage
```

### 第八步：手动测试

```bash
# 启动开发服务器
npm start

# 手动测试关键功能：
# 1. HTTP 请求是否正常
# 2. 错误处理是否工作
# 3. 拖拽功能是否正常
# 4. 选择功能是否正常
# 5. 资源池功能是否正常
```

### 第九步：提交修改

```bash
# 提交所有修改
git add .
git commit -m "feat: upgrade to RxJS 7

- Update throwError to use factory functions
- Replace Observable.forkJoin with forkJoin
- Replace Observable.of with of
- Replace Observable.fromEvent with fromEvent
- Replace Observable.combineLatest with combineLatest
- Update .do() to tap()
- Update flatMap to mergeMap
- Remove rxjs-compat dependency

Closes: #RXJS-UPGRADE
"

# 推送到远程（如果需要）
git push origin upgrade/angular-15-rxjs-7
```

### 第十步：创建 Pull Request

```bash
# 切换到主分支
git checkout master

# 合并升级分支
git merge upgrade/angular-15-rxjs-7

# 推送到远程
git push origin master
```

---

## 测试验证

### 自动化测试

#### 单元测试

```bash
# 运行所有单元测试
npm test

# 运行特定测试文件
npm test -- --testFile="http-interceptor.spec.ts"

# 监听模式
npm test -- --watch

# 生成覆盖率报告
npm run coverage
```

#### E2E 测试

```bash
# 运行 E2E 测试
npm run e2e
```

### 手动测试清单

#### HTTP 请求测试

- [ ] 登录功能正常
- [ ] API 调用成功
- [ ] 错误处理正确显示
- [ ] HTTP 拦截器工作正常
- [ ] Token 过期处理正确

#### 用户界面测试

- [ ] 页面加载正常
- [ ] 组件渲染正确
- [ ] 交互响应正常
- [ ] 动画流畅

#### 功能测试

- [ ] 项目创建/删除
- [ ] 节点操作
- [ ] 链接创建
- [ ] 拖拽功能
- [ ] 选择功能
- [ ] 资源池管理

### 性能测试

```bash
# 构建生产版本
npm run buildforproduction

# 检查包大小
ls -lh dist/

# 使用 Lighthouse 检查性能
# 1. 打开 Chrome DevTools
# 2. 运行 Lighthouse
# 3. 检查性能指标
```

---

## 回滚计划

如果升级过程中遇到严重问题，可以按以下步骤回滚：

### 回滚到升级前

```bash
# 方法 1: 使用备份标签
git checkout pre-rxjs7-upgrade
git checkout -b rollback-from-rxjs7-upgrade

# 方法 2: 使用备份分支
git checkout backup/pre-rxjs7-upgrade
git checkout -b rollback-from-rxjs7-upgrade

# 方法 3: 使用 Git reset
git reflog  # 查找升级前的提交
git checkout HEAD@{n}  # n 是升级前的提交索引
git checkout -b rollback-from-rxjs7-upgrade
```

### 回滚依赖

```bash
# 恢复 package.json
git checkout pre-rxjs7-upgrade -- package.json
git checkout pre-rxjs7-upgrade -- package-lock.json

# 重新安装依赖
rm -rf node_modules
npm install
```

---

## 常见问题

### Q1: TypeScript 编译错误 "Cannot find module 'rxjs'"

**A**: 检查 node_modules 是否正确安装：

```bash
rm -rf node_modules package-lock.json
npm install
```

### Q2: 运行时错误 "throwError is not a function"

**A**: 确保导入正确：

```typescript
// ✅ 正确
import { throwError } from 'rxjs';

// ❌ 错误
import { Observable } from 'rxjs';
// 使用 Observable.throwError (已移除)
```

### Q3: 类型错误 "Type 'Observable<unknown>' is not assignable..."

**A**: 添加明确的类型注解：

```typescript
// ✅ 添加类型
return of(null) as Observable<MyType>;

// 或使用泛型
return of<MyType>(null);
```

### Q4: forkJoin 返回类型不正确

**A**: 使用类型断言或泛型：

```typescript
// ✅ 方法 1: 类型断言
return forkJoin([
  this.http.get<TypeA>(url1),
  this.http.get<TypeB>(url2),
]).pipe(
  map(([a, b]) => /* ... */)
) as Observable<ResultType>;

// ✅ 方法 2: 使用泛型
return forkJoin<[TypeA, TypeB]>([
  this.http.get<TypeA>(url1),
  this.http.get<TypeB>(url2),
]);
```

### Q5: 测试文件报错 "Cannot read property 'and' of undefined"

**A**: 确保 spy 返回正确的 Observable：

```typescript
// ✅ 正确
import { of, throwError } from 'rxjs';
spyOn(service, 'method').and.returnValue(of(value));

// ❌ 错误
import { Observable } from 'rxjs';
spyOn(service, 'method').and.returnValue(Observable.of(value));
```

---

## 参考资源

### 官方文档

- [RxJS 7 发布说明](https://github.com/ReactiveX/rxjs/blob/master/CHANGELOG.md#700-2021-04-29)
- [RxJS 7 迁移指南](https://rxjs.dev/deprecations/breaking-changes)
- [Angular 15 升级指南](https://update.angular.io/?v=14.0-15.0)

### 社区资源

- [RxJS 7 变更总结](https://blog.angular.io/version-7-of-rxjs-is-here-bee8cf4af4f2)
- [Angular 升级工具](https://angular.io/cli/update)

### 项目特定

- GNS3 Web UI 代码仓库
- GNS3 团队开发规范
- 内部 Wiki 文档

---

## 附录

### A. 完整文件列表

#### 必须修改的文件（10个）

1. `src/app/interceptors/http.interceptor.ts`
2. `src/app/services/http-controller.service.ts`
3. `src/app/services/ai-chat.service.ts`
4. `src/app/services/resource-pools.service.ts`
5. `src/app/components/controllers/controller-discovery/controller-discovery.component.ts`
6. `src/app/components/projects/confirmation-delete-all-projects/confirmation-delete-all-projects.component.ts`
7. `src/app/components/image-manager/deleteallfiles-dialog/deleteallfiles-dialog.component.ts`
8. `src/app/cartography/components/experimental-map/draggable/draggable.component.ts`
9. `src/app/cartography/components/experimental-map/selection/selection.component.ts`
10. `src/app/components/user-management/user-detail/ai-profile-tab/ai-profile-tab.component.ts`

#### 测试文件（~20个）

包括但不限于：
- `src/app/components/controllers/controller-discovery/controller-discovery.component.spec.ts`
- `src/app/components/drawings-listeners/text-edited/text-edited.component.spec.ts`
- `src/app/components/drawings-listeners/text-added/text-added.component.spec.ts`
- `src/app/components/drawings-listeners/node-label-dragged/node-label-dragged.component.spec.ts`
- 其他 `.spec.ts` 文件

### B. 快速参考表

| RxJS 6 | RxJS 7 | 说明 |
|--------|--------|------|
| `Observable.of(value)` | `of(value)` | 移除 Observable. 前缀 |
| `Observable.fromEvent(el, type)` | `fromEvent(el, type)` | 移除 Observable. 前缀 |
| `Observable.forkJoin([obs1, obs2])` | `forkJoin([obs1, obs2])` | 移除 Observable. 前缀 |
| `Observable.combineLatest([obs1, obs2])` | `combineLatest([obs1, obs2])` | 移除 Observable. 前缀 |
| `throwError(error)` | `throwError(() => error)` | 必须使用工厂函数 |
| `Observable.throwError(error)` | `throwError(() => error)` | 移除 Observable. 前缀 + 工厂函数 |
| `.do(fn)` | `.pipe(tap(fn))` | 改名 |
| `.flatMap(fn)` | `.pipe(mergeMap(fn))` | 建议使用 mergeMap |
| `import 'rxjs/add/operator/do'` | `import { tap } from 'rxjs/operators'` | 使用新的导入方式 |
| `rxjs-compat` | (删除) | 不再兼容 |

### C. 依赖版本对照

```json
{
  "dependencies": {
    "rxjs": "^6.6.7"  // → "^7.5.0"
  },
  "devDependencies": {
    "rxjs-compat": "^6.6.7"  // → 删除
  }
}
```

---

**文档版本**: 1.0
**最后更新**: 2026-03-20
**维护者**: Frontend Team

---

## 变更历史

| 版本 | 日期 | 变更说明 | 作者 |
|------|------|----------|------|
| 1.0 | 2026-03-20 | 初始版本 | Frontend Team |

---

**END OF DOCUMENT**
