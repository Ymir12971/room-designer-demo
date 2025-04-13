package com.example.roomdesigner.controller;

import com.example.roomdesigner.model.ImageGenerationRequest;
import com.example.roomdesigner.service.ImageGenerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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


    /**
     * 创建一个新的SSE连接，分配随机的clientId
     * @return
     */
    @Operation(summary = "连接到SSE流", description = "创建一个新的SSE连接")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功创建SSE连接"),
            @ApiResponse(responseCode = "500", description = "服务器错误")
    })
    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect() {
        String clientId = UUID.randomUUID().toString();
        return imageGenerationService.createConnection(clientId);
    }

    /**
     * 创建指定clientId的SSE连接
     * @param clientId
     * @return
     */
    @Operation(summary = "使用客户端ID连接到SSE流", description = "使用指定的客户端ID创建一个新的SSE连接")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功创建SSE连接"),
            @ApiResponse(responseCode = "500", description = "服务器错误")
    })
    @GetMapping(value = "/connect/{clientId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connectWithId(@PathVariable String clientId) {
        return imageGenerationService.createConnection(clientId);
    }

    // 触发图片生成
    @Operation(summary = "生成图像", description = "基于提供的参数生成图像")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功生成图像",
                    content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "400", description = "无效的请求参数"),
            @ApiResponse(responseCode = "404", description = "客户端ID未找到"),
            @ApiResponse(responseCode = "500", description = "服务器错误")
    })
    @PostMapping("/image/{clientId}")
    public ResponseEntity<?> generateImage(
            @PathVariable String clientId,
            @RequestBody ImageGenerationRequest request) {

        imageGenerationService.generateImage(clientId, request);
        return ResponseEntity.ok().build();
    }

    // 关闭连接
    @Operation(summary = "关闭连接", description = "关闭指定客户端ID的SSE连接")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功关闭连接"),
            @ApiResponse(responseCode = "404", description = "客户端ID未找到"),
            @ApiResponse(responseCode = "500", description = "服务器错误")
    })
    @DeleteMapping("/close/{clientId}")
    public ResponseEntity<?> closeConnection(@PathVariable String clientId) {
        imageGenerationService.closeConnection(clientId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "生成图像流", description = "创建一个用于生成图像的流连接")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功创建流连接"),
            @ApiResponse(responseCode = "500", description = "服务器错误")
    })
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