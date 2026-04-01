FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app
COPY backend/api-manager /app
RUN mvn clean install -DskipTests

# Stage 2: Run
FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app
COPY --from=build /app/target/api-manager-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=$PORT -jar app.jar"]