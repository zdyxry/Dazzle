#!/bin/bash
# 检查 Docker 开发环境状态

cd "$(dirname "$0")/../docker"

echo "=== Docker 容器状态 ==="
docker compose -f docker-compose.dev.yml ps

echo ""
echo "=== Fava 健康检查 ==="
docker compose -f docker-compose.dev.yml exec fava wget -q --spider http://localhost:5001/huge-example-file/income_statement/ && echo "✅ Fava 健康" || echo "❌ Fava 不健康"

echo ""
echo "=== 从前端容器访问 Fava ==="
docker compose -f docker-compose.dev.yml exec ui wget -q --spider http://fava:5001/huge-example-file/income_statement/ && echo "✅ 前端能访问 Fava" || echo "❌ 前端无法访问 Fava"

echo ""
echo "=== Fava 日志（最近 10 行）==="
docker compose -f docker-compose.dev.yml logs --tail=10 fava

echo ""
echo "=== 前端日志（最近 10 行）==="
docker compose -f docker-compose.dev.yml logs --tail=10 ui
