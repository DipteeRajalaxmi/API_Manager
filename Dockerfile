# Use Java 17
FROM eclipse-temurin:17-jdk-jammy

# Set working directory
WORKDIR /app

# Copy jar from backend folder
COPY backend/api-manager/target/api-manager-1.0.0.jar app.jar

# Expose port (Render will override with PORT)
EXPOSE 8080

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]