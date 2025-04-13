// backend/src/main/java/com/example/roomdesigner/controller/ImageGenerationController.java
package com.example.roomdesigner.controller;

import com.example.roomdesigner.model.ImageGenerationRequest;
import com.example.roomdesigner.service.ImageGenerationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;


@Slf4j
@RestController
@RequestMapping("/api/generate")
@CrossOrigin(origins = "http://localhost:3000")
public class ImageGenerationController {

    @Autowired
    private ImageGenerationService imageGenerationService;

    // 创建SSE连接
    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect() {
        String clientId = UUID.randomUUID().toString();
        return imageGenerationService.createConnection(clientId);
    }

    // 创建指定clientId的SSE连接
    @GetMapping(value = "/connect/{clientId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connectWithId(@PathVariable String clientId) {
        return imageGenerationService.createConnection(clientId);
    }

    // 触发图片生成
    @PostMapping("/image/{clientId}")
    public ResponseEntity<?> generateImage(
            @PathVariable String clientId,
            @RequestBody ImageGenerationRequest request) {

        imageGenerationService.generateImage(clientId, request);
        return ResponseEntity.ok().build();
    }

    // 关闭连接
    @DeleteMapping("/close/{clientId}")
    public ResponseEntity<?> closeConnection(@PathVariable String clientId) {
        imageGenerationService.closeConnection(clientId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/generate-stream")
    public SseEmitter generateImageStream() {
        SseEmitter emitter = new SseEmitter(0L); // 无超时

        // 设置完成回调
        emitter.onCompletion(() -> {
            log.info("SSE连接已完成");
        });

        // 设置超时回调
        emitter.onTimeout(() -> {
            log.info("SSE连接已超时");
            emitter.complete();
        });

        // 设置错误回调
        emitter.onError((ex) -> {
            log.error("SSE错误", ex);
            emitter.complete();
        });

        // 处理图像生成逻辑...

        return emitter;
    }

}