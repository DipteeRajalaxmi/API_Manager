# Stage 1: Build JAR using Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy backend project
COPY backend/api-manager /app

# Build jar
RUN mvn clean install -DskipTests

# Stage 2: Run app
FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/api-manager-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]