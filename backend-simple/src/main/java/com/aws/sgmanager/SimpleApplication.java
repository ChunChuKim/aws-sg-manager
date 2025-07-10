package com.aws.sgmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.Map;
import java.util.HashMap;

@SpringBootApplication
public class SimpleApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(SimpleApplication.class, args);
    }
}

@RestController
@CrossOrigin(origins = "*")
class TestController {
    
    @GetMapping("/api/test")
    public Map<String, Object> test() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "🛡️ AWS Security Group Manager Backend is running!");
        response.put("status", "success");
        response.put("timestamp", System.currentTimeMillis());
        response.put("features", new String[]{
            "✅ Spring Boot 3.x",
            "✅ MongoDB Integration", 
            "✅ REST API",
            "✅ CORS Enabled",
            "✅ AWS SDK Ready"
        });
        return response;
    }
    
    @GetMapping("/api/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "AWS Security Group Manager");
        return response;
    }
}
