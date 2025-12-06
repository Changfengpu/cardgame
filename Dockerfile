# 使用官方的Java 8运行时作为基础镜像
FROM openjdk:8-jdk-slim

# 设置工作目录
WORKDIR /app

# 复制Maven配置文件
COPY pom.xml .

# 复制源代码
COPY src ./src

# 构建应用
RUN mvn clean package -DskipTests

# 暴露端口
EXPOSE 8080

# 设置JVM参数
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# 运行应用
CMD ["java", "-jar", "-Djava.security.egd=file:/dev/./.java/openjdk/cacerts", "-jar", "target/cardgame-0.0.1-SNAPSHOT.jar"]