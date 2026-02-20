#!/bin/bash
# 开发环境启动脚本 - 支持热重载，无需 nginx

set -e

cd "$(dirname "$0")/../docker"

echo "🚀 启动开发环境..."
echo ""

# 检查是否已有容器在运行
if docker compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "⚠️  开发环境已在运行，先停止现有容器..."
    docker compose -f docker-compose.dev.yml down
fi

echo "📦 启动 Fava 后端和前端开发服务器..."
echo ""
echo "访问地址:"
echo "  - 前端: http://localhost:5173"
echo "  - Fava: http://localhost:5001"
echo ""
echo "热重载: ✅ 已启用（修改代码后自动刷新）"
echo ""

docker compose -f docker-compose.dev.yml up --build "$@"
