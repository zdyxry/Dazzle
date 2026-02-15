# Dazzle

基于 Fava 后端的现代化 React 前端原型

## 技术栈

- **React 18** + **TypeScript** - 现代 React 开发
- **TanStack Query** - 数据获取和缓存
- **Zustand** - 轻量级状态管理
- **shadcn/ui** - 高质量的 UI 组件
- **Tailwind CSS** - 实用优先的 CSS 框架
- **React Router** - 客户端路由
- **Vite** - 快速的开发构建工具

## 已实现功能

### 报表
- [x] 资产负债表 (Balance Sheet)
- [x] 损益表 (Income Statement)
- [x] 试算平衡表 (Trial Balance)
- [x] 日记账 (Journal) - 支持分页

### 功能
- [x] 过滤器（时间、账户、高级过滤）
- [x] 账户树形表格（可展开/折叠）
- [x] 文件变化自动检测
- [x] 响应式布局
- [x] 错误提示

## 开发

### 1. 安装依赖

```bash
cd dazzle
npm install
```

### 2. 启动 Fava 后端

```bash
# 在项目根目录
fava contrib/examples/example.beancount --host 127.0.0.1 --port 5000

# 或使用脚本
cd dazzle
./start-fava.sh
```

### 3. 启动前端开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 构建生产版本

```bash
npm run build
```

## 项目结构

```
dazzle/
├── src/
│   ├── components/       # React 组件
│   │   ├── ui/          # shadcn/ui 基础组件
│   │   ├── AccountTreeTable.tsx  # 账户树表格
│   │   ├── FilterBar.tsx         # 过滤器栏
│   │   └── Layout.tsx            # 页面布局
│   ├── hooks/           # 自定义 Hooks
│   │   └── useLedger.ts # 账本数据获取
│   ├── lib/             # 工具函数
│   │   ├── api.ts       # API 客户端
│   │   └── utils.ts     # 通用工具
│   ├── pages/           # 页面组件
│   │   ├── BalanceSheet.tsx
│   │   ├── IncomeStatement.tsx
│   │   ├── Journal.tsx
│   │   ├── TrialBalance.tsx
│   │   └── AccountDetail.tsx
│   ├── stores/          # 状态管理
│   │   └── ledger.ts    # 账本状态
│   ├── types/           # TypeScript 类型
│   │   └── index.ts
│   ├── main.tsx         # 应用入口
│   └── index.css        # 全局样式
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## API 说明

前端通过代理访问 Fava 后端 API：

| 端点 | 说明 |
|------|------|
| `GET /api/ledger_data` | 获取账本基础数据 |
| `GET /api/balance_sheet` | 资产负债表 |
| `GET /api/income_statement` | 损益表 |
| `GET /api/trial_balance` | 试算平衡表 |
| `GET /api/journal_page` | 日记账（分页） |
| `GET /api/changed` | 检查文件变化 |

## 与原 Fava 的对比

| 特性 | 原 Fava | Fava Modern UI |
|------|---------|----------------|
| 技术栈 | Flask + Svelte 混合 | React 18 SPA |
| 渲染方式 | 服务端 + 客户端混合 | 纯客户端渲染 |
| 状态管理 | Svelte Stores | Zustand |
| 数据获取 | 自定义封装 | TanStack Query |
| UI 组件 | 自定义 | shadcn/ui |
| 路由 | 自定义 Router | React Router |
| 开发体验 | 较复杂 | 现代化工具链 |

## 下一步可扩展功能

1. **图表可视化** - 集成 ECharts 展示资产趋势
2. **编辑器** - 集成 CodeMirror 6 编辑账本
3. **导入功能** - 文件导入和自动识别
4. **查询功能** - Beancount 查询语句支持
5. **多账本切换** - 支持多个账本文件
6. **主题切换** - 深色/浅色模式
7. **移动端优化** - 更好的移动体验

## 许可证

MIT
