#!/bin/bash
###############################################################################
# GNS3 Web UI - RxJS 6 → 7 自动迁移脚本
#
# 用途：批量修改 RxJS 6 代码以兼容 RxJS 7
# 使用方法：./migrate-rxjs7.sh
# 注意：运行前请先提交代码或创建新分支
#
# 作者：Frontend Team
# 日期：2026-03-20
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/home/yueguobin/myCode/GNS3/gns3-web-ui"
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RxJS 6 → 7 自动迁移脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查是否在 git 仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}错误：不在 git 仓库中${NC}"
    exit 1
fi

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}警告：有未提交的更改${NC}"
    echo -e "${YELLOW}建议先提交或暂存更改${NC}"
    read -p "是否继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 创建备份分支
BACKUP_BRANCH="backup/pre-rxjs7-migration-$(date +%Y%m%d-%H%M%S)"
echo -e "${BLUE}创建备份分支：${BACKUP_BRANCH}${NC}"
git branch "$BACKUP_BRANCH"
echo -e "${GREEN}✓ 备份分支创建完成${NC}"
echo ""

# 创建临时日志文件
LOG_FILE="rxjs7-migration-$(date +%Y%m%d-%H%M%S).log"
echo "迁移日志 - $(date)" > "$LOG_FILE"
echo "================================" >> "$LOG_FILE"

###############################################################################
# 第一步：修改源代码文件（非测试文件）
###############################################################################

echo -e "${BLUE}第一步：修改源代码文件${NC}"
echo "========================================"

# 1. 修改 throwError 参数
echo -n "修改 throwError 参数..."
find src -name "*.ts" -type f ! -name "*.spec.ts" -exec sed -i 's/throwError(\([^()]*\))/throwError(() => \1)/g' {} + >> "$LOG_FILE" 2>&1
echo -e " ${GREEN}✓${NC}"
echo "  - 已修改：throwError(x) → throwError(() => x)"

# 2. 修改 Observable.forkJoin
echo -n "修改 Observable.forkJoin..."
find src -name "*.ts" -type f -exec sed -i 's/Observable\.forkJoin/forkJoin/g' {} + >> "$LOG_FILE" 2>&1
echo -e " ${GREEN}✓${NC}"
echo "  - 已修改：Observable.forkJoin → forkJoin"

# 3. 修改 Observable.of
echo -n "修改 Observable.of..."
find src -name "*.ts" -type f ! -name "*.spec.ts" -exec sed -i 's/Observable\.of(/of(/g' {} + >> "$LOG_FILE" 2>&1
echo -e " ${GREEN}✓${NC}"
echo "  - 已修改：Observable.of(x) → of(x)"

# 4. 修改 Observable.fromEvent
echo -n "修改 Observable.fromEvent..."
find src -name "*.ts" -type f -exec sed -i 's/Observable\.fromEvent/fromEvent/g' {} + >> "$LOG_FILE" 2>&1
echo -e " ${GREEN}✓${NC}"
echo "  - 已修改：Observable.fromEvent → fromEvent"

# 5. 修改 Observable.combineLatest
echo -n "修改 Observable.combineLatest..."
find src -name "*.ts" -type f -exec sed -i 's/Observable\.combineLatest/combineLatest/g' {} + >> "$LOG_FILE" 2>&1
echo -e " ${GREEN}✓${NC}"
echo "  - 已修改：Observable.combineLatest → combineLatest"

echo -e "${GREEN}✓ 源代码文件修改完成${NC}"
echo ""

###############################################################################
# 第二步：修改测试文件
###############################################################################

echo -e "${BLUE}第二步：修改测试文件${NC}"
echo "========================================"

# 1. 修改测试文件中的 Observable.of
echo -n "修改测试文件中的 Observable.of..."
find src -name "*.spec.ts" -type f -exec sed -i 's/Observable\.of(/of(/g' {} + >> "$LOG_FILE" 2>&1
echo -e " ${GREEN}✓${NC}"

# 2. 修改测试文件中的 Observable.throwError
echo -n "修改测试文件中的 Observable.throwError..."
find src -name "*.spec.ts" -type f -exec sed -i 's/Observable\.throwError(\([^)]*\))/throwError(() => \1)/g' {} + >> "$LOG_FILE" 2>&1
echo -e " ${GREEN}✓${NC}"

# 3. 修改测试文件中的 new Observable() 为 EMPTY
echo -n "修改测试文件中的 new Observable()..."
find src -name "*.spec.ts" -type f -exec sed -i 's/new Observable()/EMPTY/g' {} + >> "$LOG_FILE" 2>&1
echo -e " ${GREEN}✓${NC}"

echo -e "${GREEN}✓ 测试文件修改完成${NC}"
echo ""

###############################################################################
# 第三步：生成手动修改清单
###############################################################################

echo -e "${BLUE}第三步：生成手动修改清单${NC}"
echo "========================================"

MANUAL_FILE="docs/angular-14-15/需要手动修改的文件.txt"
echo "需要手动修改的文件列表" > "$MANUAL_FILE"
echo "生成时间：$(date)" >> "$MANUAL_FILE"
echo "========================================" >> "$MANUAL_FILE"
echo "" >> "$MANUAL_FILE"

# 查找包含 .do() 的文件
echo "查找包含 .do() 操作符的文件..."
DO_FILES=$(find src -name "*.ts" -type f -exec grep -l "\.do(" {} \; || true)
if [ -n "$DO_FILES" ]; then
    echo "以下文件包含 .do() 操作符，需要手动修改为 .pipe(tap())：" >> "$MANUAL_FILE"
    echo "$DO_FILES" | while read file; do
        echo "  - $file" >> "$MANUAL_FILE"
        # 找到具体行号
        grep -n "\.do(" "$file" >> "$MANUAL_FILE"
    done
    echo "" >> "$MANUAL_FILE"
fi

# 查找包含 flatMap 的文件
echo "查找包含 flatMap 的文件..."
FLATMAP_FILES=$(find src -name "*.ts" -type f -exec grep -l "\.flatMap(" {} \; || true)
if [ -n "$FLATMAP_FILES" ]; then
    echo "以下文件包含 flatMap，建议改为 mergeMap：" >> "$MANUAL_FILE"
    echo "$FLATMAP_FILES" | while read file; do
        echo "  - $file" >> "$MANUAL_FILE"
    done
    echo "" >> "$MANUAL_FILE"
fi

# 检查导入语句
echo "检查需要添加的导入语句..."
echo "" >> "$MANUAL_FILE"
echo "需要检查并添加的导入语句：" >> "$MANUAL_FILE"
echo "1. forkJoin: import { forkJoin } from 'rxjs';" >> "$MANUAL_FILE"
echo "2. of: import { of } from 'rxjs';" >> "$MANUAL_FILE"
echo "3. fromEvent: import { fromEvent } from 'rxjs';" >> "$MANUAL_FILE"
echo "4. combineLatest: import { combineLatest } from 'rxjs';" >> "$MANUAL_FILE"
echo "5. tap: import { tap } from 'rxjs/operators';" >> "$MANUAL_FILE"
echo "6. startWith: import { startWith } from 'rxjs/operators';" >> "$MANUAL_FILE"
echo "7. mergeMap: import { mergeMap } from 'rxjs/operators';" >> "$MANUAL_FILE"
echo "8. EMPTY: import { EMPTY } from 'rxjs';" >> "$MANUAL_FILE"

echo -e "${GREEN}✓ 手动修改清单已生成：$MANUAL_FILE${NC}"
echo ""

###############################################################################
# 第四步：统计修改
###############################################################################

echo -e "${BLUE}第四步：修改统计${NC}"
echo "========================================"

# 统计修改的文件数
MODIFIED_FILES=$(git diff --name-only | wc -l)
echo "修改的文件数量：$MODIFIED_FILES"

# 统计 throwError 修改次数
THROW_COUNT=$(git diff | grep -c "throwError(() =>" || true)
echo "throwError 修改次数：$THROW_COUNT"

# 统计 forkJoin 修改次数
FORKJOIN_COUNT=$(git diff | grep -c "forkJoin" || true)
echo "forkJoin 修改次数：$FORKJOIN_COUNT"

echo ""

###############################################################################
# 第五步：编译检查
###############################################################################

echo -e "${BLUE}第五步：编译检查${NC}"
echo "========================================"

read -p "是否运行编译检查？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "运行 TypeScript 编译检查..."
    if npm run build 2>&1 | tee -a "$LOG_FILE"; then
        echo -e "${GREEN}✓ 编译成功${NC}"
    else
        echo -e "${RED}✗ 编译失败${NC}"
        echo "请检查错误信息并手动修复"
        echo "编译日志已保存到：$LOG_FILE"
    fi
else
    echo -e "${YELLOW}跳过编译检查${NC}"
fi

echo ""

###############################################################################
# 完成
###############################################################################

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}迁移完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "下一步操作："
echo "  1. 检查需要手动修改的文件：${YELLOW}$MANUAL_FILE${NC}"
echo "  2. 手动修改 .do() 操作符为 .pipe(tap())"
echo "  3. 检查并添加必要的导入语句"
echo "  4. 运行编译检查：${YELLOW}npm run build${NC}"
echo "  5. 运行测试：${YELLOW}npm test${NC}"
echo "  6. 提交更改：${YELLOW}git add . && git commit -m 'feat: migrate to RxJS 7'${NC}"
echo ""
echo -e "备份分支：${YELLOW}$BACKUP_BRANCH${NC}"
echo -e "迁移日志：${YELLOW}$LOG_FILE${NC}"
echo ""
echo -e "${GREEN}祝你好运！${NC}"
echo ""
