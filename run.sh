#!/bin/bash

# 设置Java环境变量
export JAVA_HOME="/usr/lib/jvm/jdk1.8.0_381"
export PATH="$JAVA_HOME/bin:$PATH"

# 进入项目目录
cd /home/singhand/gameProject/cardgame

# 编译Java文件
echo "正在编译Java文件..."
mkdir -p target/classes
javac -d target/classes -cp "target/classes" src/main/java/com/singhand/cardgame/model/*.java src/main/java/com/singhand/cardgame/service/*.java src/main/java/com/singhand/cardgame/controller/*.java src/main/java/com/singhand/cardgame/config/*.java src/main/java/com/singhand/cardgame/util/*.java src/main/java/com/singhand/cardgame/CardgameApplication.java

if [ $? -eq 0 ]; then
    echo "编译成功！"
    echo "正在启动应用程序..."
    java -cp "target/classes" com.singhand.cardgame.CardgameApplication
else
    echo "编译失败！"
fi