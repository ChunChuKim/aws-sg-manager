package com.aws.sgmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AwsSecurityGroupManagerApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(AwsSecurityGroupManagerApplication.class, args);
    }
}
