package com.example.roomdesigner.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageGenerationRequest {
    @Schema(description = "源图片URL")
    private String sourceImageUrl; // 源图片URL

    @Schema(description = "用户提示词", example = "现代风格的客厅，带有大窗户和绿色植物")
    private String prompt; // 用户提示词

    @Schema(description = "设计风格", example = "工业风")
    private String style; // 设计风格
}