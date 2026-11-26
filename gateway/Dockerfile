# ==============================================================================
# Multi-Stage Dockerfile for ARSA Spring Cloud Gateway
# Optimized for Render Docker Web Service Deployment
# ==============================================================================

# --- Stage 1: Build Application with Maven & Temurin JDK 21 ---
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Cache Maven dependencies by copying pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Minimal, Hardened Runtime Environment ---
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Create non-privileged user and group for container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled JAR from builder stage
COPY --from=builder /build/target/gateway-0.0.1-SNAPSHOT.jar app.jar
RUN chown -R appuser:appgroup /app

# Drop root privileges
USER appuser

# Document exposed ports (Render dynamically assigns $PORT at runtime)
EXPOSE 8081 10000

# Set default environment variables (overridable by Render dashboard)
ENV SERVER_PORT=8081 \
    SERVER_ADDRESS=0.0.0.0 \
    SBMS_BACKEND_URL=https://sri-balaji-medi-systems.onrender.com \
    CORS_ALLOWED_ORIGINS=https://sri-balaji-medi-frontend.onrender.com \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Start the Gateway using sh -c exec to pass signals properly
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
