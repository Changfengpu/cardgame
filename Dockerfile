# 使用Maven镜像构建应用
FROM maven:3.8.6-jdk-8 AS builder

# 设置工作目录
WORKDIR /app

# 复制Maven配置文件
COPY pom.xml .

# 复制源代码
COPY src ./src

# 复制卡牌数据文件
COPY cards_data.txt ./src/main/resources/

# 构建应用
RUN mvn clean package -DskipTests

# 使用OpenJDK镜像运行应用
FROM openjdk:8-jdk-alpine

# 设置工作目录
WORKDIR /app

# 复制已构建的JAR文件
COPY --from=builder /app/target/cardgame-0.0.1-SNAPSHOT.jar app.jar

# 暴露端口
EXPOSE 8080

# 设置JVM参数
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# 运行应用
CMD ["java", "-jar", "-Djava.security.egd=file:/dev/./.java/openjdk/cacerts", "app.jar"]