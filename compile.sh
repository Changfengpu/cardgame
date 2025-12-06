#!/bin/bash

# 设置Java环境变量
export JAVA_HOME="/usr/lib/jvm/jdk1.8.0_381"
export PATH="$JAVA_HOME/bin:$PATH"

# 进入项目目录
cd /home/singhand/gameProject/cardgame

# 创建目标目录
mkdir -p target/classes
mkdir -p target/lib

# 下载Spring Boot依赖（简化版本）
echo "正在准备依赖..."

# 编译Java文件
echo "正在编译Java文件..."
javac -d target/classes -cp "target/classes" \
    src/main/java/com/singhand/cardgame/model/*.java \
    src/main/java/com/singhand/cardgame/service/*.java \
    src/main/java/com/singhand/cardgame/controller/*.java \
    src/main/java/com/singhand/cardgame/config/*.java \
    src/main/java/com/singhand/cardgame/util/*.java \
    src/main/java/com/singhand/cardgame/CardgameApplication.java

if [ $? -eq 0 ]; then
    echo "编译成功！"
    echo "注意：由于缺少Spring Boot依赖，无法直接运行完整应用。"
    echo "请使用Maven或Gradle来管理依赖并运行应用程序。"
    echo ""
    echo "API接口列表："
    echo "POST /api/game/player/create?username={username} - 创建玩家"
    echo "GET /api/game/player/{username} - 获取玩家信息"
    echo "POST /api/game/player/{username}/buy-pack?packType={PACK_TYPE} - 购买卡牌包"
    echo "POST /api/game/player/{username}/open-pack?packId={packId} - 开卡牌包"
    echo "POST /api/game/player/{username}/sell-card?cardId={cardId} - 卖卡牌"
    echo "GET /api/game/player/{username}/collection - 查看卡牌册"
    echo "GET /api/game/player/{username}/backpack - 查看背包"
    echo "GET /api/game/player/{username}/money - 查看金币"
    echo "GET /api/game/cards - 查看所有卡牌"
    echo "GET /api/game/pack-types - 查看卡牌包类型"
else
    echo "编译失败！"
fi