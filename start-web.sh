#!/bin/bash

echo "启动卡牌买卖模拟器Web应用..."

# 检查Java版本
java -version

# 编译项目
echo "编译项目..."
mvn clean compile

if [ $? -eq 0 ]; then
    echo "编译成功，启动Spring Boot应用..."
    echo "应用将在 http://localhost:8080 启动"
    echo "按 Ctrl+C 停止应用"
    mvn spring-boot:run
else
    echo "编译失败，请检查代码"
    exit 1
fi