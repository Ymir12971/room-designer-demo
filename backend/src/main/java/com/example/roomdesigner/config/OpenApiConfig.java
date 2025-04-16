package com.example.roomdesigner.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI roomDesignerOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("房间设计API")
                        .description("用于生成和管理房间设计图像的API")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("房间设计团队")
                                .email("support@example.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server().url("/").description("默认服务器URL")
                ));
    }

    // 添加组件扫描配置
    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public-api")
                .pathsToMatch("/api/**", "/connect/**", "/image/**", "/close/**", "/generate-stream/**")
                .build();
    }

}