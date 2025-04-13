package com.example.roomdesigner.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageGenerationRequest {
    private String sourceImageUrl; // 源图片URL
    private String prompt; // 用户提示词
    private String style; // 设计风格
}