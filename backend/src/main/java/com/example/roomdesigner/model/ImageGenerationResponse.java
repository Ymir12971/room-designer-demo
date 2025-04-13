package com.example.roomdesigner.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageGenerationResponse {
    private String imageUrl; // 生成的图片URL
    private String description; // 设计说明
    private String status; // 生成状态: "processing", "completed", "failed"
    private int progress; // 进度百分比, 0-100
}