# ─── Stage 1: Build ─────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Cache dependencies — only re-downloads when pom.xml changes
COPY pom.xml .
RUN mvn dependency:resolve -q

# Compile and package
COPY src/ src/
RUN mvn clean package -DskipTests -q

# ─── Stage 2: Runtime ────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8081

# UseContainerSupport lets the JVM respect container memory limits
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "app.jar"]
