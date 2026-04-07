package com.apimanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
// import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableAsync
public class ApiManagerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiManagerApplication.class, args);
    }
}