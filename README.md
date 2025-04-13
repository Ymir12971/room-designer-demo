# 房间设计器演示(Room Designer Demo)

这是一个使用人工智能技术实现房间设计可视化的Web应用。本项目允许用户通过文字描述生成房间的设计图像，实现设计理念的快速可视化。

## 项目结构

本项目采用前后端分离架构：

- `frontend/`: React前端应用
- `backend/`: Spring Boot后端服务

## 技术栈

### 前端
- React 18.2.0
- React DOM 18.2.0
- 现代JavaScript与CSS
- 使用npm作为包管理器

### 后端
- Java 21
- Spring Boot
- Jakarta EE
- Lombok
- Server-Sent Events (SSE)技术实现实时通信

## 功能特点

- 基于文本描述生成房间设计的AI图像生成
- 实时处理状态更新
- 客户端唯一标识确保会话持久性
- 完整的错误处理机制
- 跨源资源共享(CORS)支持

## 安装说明

### 前端

```bash
cd frontend
npm install
npm start
```

### 后端

```bash
cd backend
./mvnw spring-boot:run
```

或者使用你的IDE打开项目并运行。

## API端点

后端服务提供以下API端点：

- `GET /connect`: 创建新的SSE连接
- `GET /connect/{clientId}`: 使用指定客户端ID创建SSE连接
- `POST /image/{clientId}`: 为指定客户端生成图像
- `DELETE /close/{clientId}`: 关闭指定客户端的连接
- `GET /generate-stream`: 提供图像生成的事件流

## 开发说明

本项目使用Git进行版本控制，请确保遵循`.gitignore`文件中的规定，避免将不必要的文件提交到版本库中。

## 系统要求

- Node.js 16+
- Java 21+
- 现代浏览器支持(Chrome, Firefox, Safari, Edge)

## 贡献指南

1. Fork本仓库
2. 创建你的特性分支: `git checkout -b my-new-feature`
3. 提交你的更改: `git commit -am 'Add some feature'`
4. 推送到分支: `git push origin my-new-feature`
5. 提交Pull Request

## 许可证

[在此添加你选择的许可证]
