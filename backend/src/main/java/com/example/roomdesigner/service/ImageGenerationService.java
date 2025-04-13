// backend/src/main/java/com/example/roomdesigner/service/ImageGenerationService.java
package com.example.roomdesigner.service;

import com.example.roomdesigner.model.ImageGenerationRequest;
import com.example.roomdesigner.model.ImageGenerationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
public class ImageGenerationService {

    // 使用ConcurrentHashMap来安全地处理多线程访问
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    // 使用ConcurrentHashMap来跟踪连接状态
    private final Map<String, Boolean> activeConnections = new ConcurrentHashMap<>();

    private final ExecutorService executorService = Executors.newCachedThreadPool();

    /**
     * 创建新的SSE连接
     * @param clientId 客户端ID
     * @return 新的SseEmitter实例
     */
    public SseEmitter createConnection(String clientId) {
        // 设置较长的超时时间，防止连接过早关闭
        SseEmitter emitter = new SseEmitter(180000L); // 3分钟超时

        // 设置连接关闭时的回调
        emitter.onCompletion(() -> {
            activeConnections.put(clientId, false);
            emitters.remove(clientId);
        });

        emitter.onTimeout(() -> {
            activeConnections.put(clientId, false);
            emitters.remove(clientId);
        });

        emitter.onError(e -> {
            activeConnections.put(clientId, false);
            emitters.remove(clientId);
        });

        // 存储emitter并标记连接为活跃
        emitters.put(clientId, emitter);
        activeConnections.put(clientId, true);

        // 发送初始连接事件
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECT")
                    .data("连接已建立"));
        } catch (IOException e) {
            // 如果初始连接事件发送失败，我们应该关闭连接
            closeConnection(clientId);
        }

        return emitter;
    }


    /**
     * 生成图像并将结果发送给客户端
     * @param clientId 客户端ID
     * @param request 图像生成请求
     */
    public void generateImage(String clientId, ImageGenerationRequest request) {
        SseEmitter emitter = emitters.get(clientId);
        if (emitter == null || !activeConnections.getOrDefault(clientId, false)) {
            log.warn("客户端 {} 的连接不存在或已关闭", clientId);
            return;
        }

        executorService.execute(() -> {
            try {
                // 生成结果
                ImageGenerationResponse response = mockAlgorithmResponse(request);

                // 在开始进度更新之前，先发送说明信息
                Map<String, Object> descriptionData = new HashMap<>();
                descriptionData.put("type", "description");
                // 可以提前生成描述，或使用请求中的信息构建初步描述
                descriptionData.put("preliminaryDescription", "您选择的风格是：" + request.getStyle());
                descriptionData.put("description", "正在根据您的要求生成图像：" + request.getPrompt());
                descriptionData.put("thinking", response.getDescription());

                // 发送描述信息
                emitter.send(SseEmitter.event()
                        .name("THINKING")
                        .data(descriptionData));

                // 给前端一点时间处理描述
                Thread.sleep(300);

                // 发送进度更新 - 确保使用JSON格式
                for (int progress = 10; progress <= 90; progress += 10) {
                    if (!activeConnections.getOrDefault(clientId, false)) {
                        return;
                    }

                    // 创建JSON对象
                    Map<String, Object> progressData = new HashMap<>();
                    progressData.put("type", "progress");
                    progressData.put("progress", progress);

                    // 发送JSON数据
                    emitter.send(SseEmitter.event()
                            .name("PROGRESS")
                            .data(progressData));  // Spring会自动将Map转换为JSON

                    Thread.sleep(500);
                }

                // 模拟处理时间
                Thread.sleep(1000);

                if (!activeConnections.getOrDefault(clientId, false)) {
                    return;
                }

                // 生成结果
//                ImageGenerationResponse response = mockAlgorithmResponse(request);

                // 创建完成消息 - 使用JSON对象
                Map<String, Object> completeData = new HashMap<>();
                completeData.put("type", "complete");
                completeData.put("message", "图像生成完成");
                completeData.put("imageUrl", response.getImageUrl());
                completeData.put("timestamp", System.currentTimeMillis());
//                completeData.put("description", response.getDescription());
                

                // 发送JSON数据
                emitter.send(SseEmitter.event()
                        .name("COMPLETE")
                        .data(completeData));

                log.info("图像生成完成，已发送结果: {}", response.getImageUrl());

            } catch (IOException e) {
                log.error("发送SSE事件失败: {}", e.getMessage());
                closeConnection(clientId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("图像生成过程被中断");
                closeConnection(clientId);
            }
        });
    }


    // 模拟算法返回结果
    private ImageGenerationResponse mockAlgorithmResponse(ImageGenerationRequest request) {
        // 选择样式对应的图片
        String imageUrl;
        StringBuilder description = new StringBuilder();

        String styleLower = request.getStyle() != null ? request.getStyle().toLowerCase() : "";

        if (styleLower.contains("现代") || styleLower.contains("简约")) {
            imageUrl = "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1287&auto=format&fit=crop";
            description.append("为您创建了一个现代简约风格的设计。简洁的线条和形状，中性的色调，强调留白和空间感。");
        } else if (styleLower.contains("北欧")) {
            imageUrl = "https://images.unsplash.com/photo-1595515426401-4bb0a8049d6d?q=80&w=1316&auto=format&fit=crop";
            description.append("为您创建了一个北欧风格的设计。自然材质如木材和亚麻布，明亮的色调搭配柔和的色彩。");
        } else if (styleLower.contains("工业")) {
            imageUrl = "https://images.unsplash.com/photo-1604014056465-3e5fe687c711?q=80&w=1170&auto=format&fit=crop";
            description.append("为您创建了一个工业风格的设计。裸露的砖墙、管道和结构元素，金属与木材的结合。");
        } else if (styleLower.contains("田园")) {
            imageUrl = "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1170&auto=format&fit=crop";
            description.append("为您创建了一个田园风格的设计。柔和的色调、花卉图案和复古家具。");
        } else {
            // 默认图片
            imageUrl = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1170&auto=format&fit=crop";
            description.append("创建了一个平衡而和谐的空间设计，融合了多种风格元素。");
        }

        // 添加关于用户提示的内容
        if (request.getPrompt() != null && !request.getPrompt().isEmpty()) {
            description.append("\n\n根据您的提示「").append(request.getPrompt()).append("」，");
            description.append("我们特别调整了设计方案，满足您的个性化需求。");
        }

        // 添加思考过程
        description.append("\n\n设计思考过程：\n");
        description.append("1. 分析原始图片的空间结构和基本元素\n");
        description.append("2. 确定与您的需求相符的设计方向\n");
        description.append("3. 调整色彩方案和材质搭配\n");
        description.append("4. 优化家具布局和装饰元素\n");
        description.append("5. 调整光影效果以增强整体氛围");

        return new ImageGenerationResponse(imageUrl, description.toString(), "completed", 100);
    }

    // 关闭连接
    public void closeConnection(String clientId) {
        SseEmitter emitter = emitters.remove(clientId);
        if (emitter != null) {
            try {
                emitter.complete();
            } catch (Exception e) {
                // 忽略异常，记录日志
            }
        }
    }
}