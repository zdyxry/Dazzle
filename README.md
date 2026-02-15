# Dazzle

基于 Fava 后代的现代化 React 前端

## 快速开始

使用 Docker Compose 一键启动：

```bash
cd docker
docker compose up -d
```

访问 http://localhost:8080

## 开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 3. 构建生产版本

```bash
npm run build
```

## 技术栈

- **React 18** + **TypeScript**
- **TanStack Query** - 数据获取和缓存
- **Zustand** - 状态管理
- **shadcn/ui** - UI 组件
- **Tailwind CSS** - CSS 框架
- **React Router** - 客户端路由
- **Vite** - 构建工具
- **ECharts** - 图表可视化

## 项目结构

```
dazzle/
├── docker/               # Docker 配置
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── nginx.conf
│   └── example.beancount # 示例账本
├── src/
│   ├── components/       # React 组件
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # 工具函数
│   ├── pages/            # 页面组件
│   ├── stores/           # 状态管理
│   └── types/            # TypeScript 类型
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 许可证

MIT
