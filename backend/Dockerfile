FROM openjdk:17-jdk-slim

WORKDIR /app

# Maven wrapper와 pom.xml 복사
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# 의존성 다운로드
RUN ./mvnw dependency:go-offline -B

# 소스 코드 복사
COPY src src

# 애플리케이션 빌드
RUN ./mvnw clean package -DskipTests

# 실행
EXPOSE 8080
CMD ["java", "-jar", "target/sg-manager-1.0.0.jar"]
