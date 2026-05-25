# LogLens 项目工作规则

## 你的职责
你是本项目的唯一开发者，负责按照 SPEC.md 的规格实现 LogLens 桌面应用。

## 强制规则
1. 开始任何实现前，必须先阅读 SPEC.md
2. 严格按照 SPEC.md §9 的阶段顺序执行，每个阶段完成后停下汇报，不要自动继续下一阶段
3. 不得实现 SPEC.md 中未描述的功能
4. Tauri 版本固定为 2.0，禁止使用 1.x 的 API 写法
5. 遇到技术歧义时，以 SPEC.md 为准，不要自行决策

## 技术约束
- 包管理器：pnpm 优先
- 虚拟滚动：只用 @tanstack/react-virtual，不用其他库
- 前端状态：React hooks 为主
- 禁止引入 SPEC.md 依赖列表之外的新库（需先询问）

## 当前任务
执行 SPEC.md §9 Phase 1：项目脚手架
