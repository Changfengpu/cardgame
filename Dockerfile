# 使用Maven官方镜像，包含Java和Maven
FROM maven:3.8.4-openjdk-17

# 设置工作目录
WORKDIR /app

# 复制Maven配置文件
COPY pom.xml .

# 复制源代码
COPY src ./src

# 复制卡牌数据文件
COPY cards_data.txt .

# 构建应用
RUN mvn clean package -DskipTests

# 暴露端口
EXPOSE 8080

# 设置JVM参数
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# 运行应用
CMD ["java", "-jar", "-Djava.security.egd=file:/dev/./.java/openjdk/cacerts", "-jar", "target/cardgame-0.0.1-SNAPSHOT.jar"]