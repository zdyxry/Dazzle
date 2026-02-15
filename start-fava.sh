#!/bin/bash

# 启动 Fava 后端
# 使用方法: ./start-fava.sh [账本文件路径]

LEDGER_FILE="${1:-../contrib/examples/example.beancount}"

echo "启动 Fava 后端..."
echo "账本文件: $LEDGER_FILE"
echo ""
echo "API 地址: http://localhost:5001"
echo "前端开发服务器: http://0.0.0.0:5173"
echo ""

# 检查 fava 是否安装
if ! command -v fava &>/dev/null; then
	echo "错误: fava 未安装"
	echo "请先安装 fava: pip install fava"
	exit 1
fi

# 启动 fava
fava "$LEDGER_FILE" --host 127.0.0.1 --port 5001
