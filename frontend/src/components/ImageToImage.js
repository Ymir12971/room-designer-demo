import React, { useState, useEffect, useRef } from 'react';
import './ImageToImage.css';

const STYLE_OPTIONS = ['现代简约风格', '北欧风格', '工业风格', '田园风格'];
const CONNECTION_TIMEOUT = 30000; // 30秒连接超时
const MAX_RETRY_COUNT = 3; // 最大重试次数

const ImageToImage = () => {
  const [imageUrl, setImageUrl] = useState('https://d17axom7zrjq3q.cloudfront.net/AI_GENERATE/20250312/f64b46f7-39c9-4575-b636-ff79d6669319.png');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('现代简约风格'); // 默认选中第一个风格
  const [resultImage, setResultImage] = useState('');
  const [displayedText, setDisplayedText] = useState(''); // 新增状态用于显示的文本
  const [responseText, setResponseText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [clientId, setClientId] = useState(null);
  const [eventSource, setEventSource] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [abortController, setAbortController] = useState(null);

  // 使用 useRef 保存超时ID，以便在需要时清除
  const timeoutRef = useRef(null);
  const requestInProgressRef = useRef(false);
  const typewriterRef = useRef(null); // 用于保存打字机效果的定时器ID
  const clientIdRef = useRef(null);

  // 打字机效果
  useEffect(() => {
    if (responseText) {
      // 清除之前的打字机定时器
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }

      // 重置显示文本，从头开始打字效果
      setDisplayedText('');

      let index = 0;
      // 设置定时器，每25毫秒添加一个字符
      typewriterRef.current = setInterval(() => {
        if (index < responseText.length) {
          setDisplayedText(prev => prev + responseText.charAt(index));
          index++;
        } else {
          // 完成后清除定时器
          clearInterval(typewriterRef.current);
        }
      }, 25); // 可以调整速度
    }

    // 组件卸载时清除定时器
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    };
  }, [responseText]);

  // 监听网络状态变化
  useEffect(() => {
    const handleOffline = () => {
      if (requestInProgressRef.current) {
        setError('网络连接已断开，请检查网络后重试');
        closeConnection();
      }
    };

    const handleOnline = () => {
      if (requestInProgressRef.current && error) {
        setError('网络已重新连接，可以继续操作');
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [error]);

  // 组件卸载时清理SSE连接
  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [eventSource, clientId]);

  // 关闭连接并清理资源的函数
  const closeConnection = () => {
    requestInProgressRef.current = false;

    // 清除超时计时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 关闭SSE连接
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }

    // 中止正在进行的fetch请求
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    // 通知服务器关闭连接
    if (clientId) {
      fetch(`http://localhost:8080/api/generate/close/${clientId}`, {
        method: 'DELETE'
      }).catch(err => {
        console.error('关闭连接时发生错误:', err);
      });
    }
  };

  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
  };

  // 重试连接
  const retryConnection = () => {
    if (retryCount < MAX_RETRY_COUNT) {
      setRetryCount(prevCount => prevCount + 1);
      console.log(`尝试重新连接 (${retryCount + 1}/${MAX_RETRY_COUNT})...`);

      // 清除旧的事件源
      if (eventSource) {
        eventSource.close();
      }

      // 重新创建SSE连接
      setupEventSource(clientId);
    } else {
      setError(`连接失败，已尝试 ${MAX_RETRY_COUNT} 次，请稍后重试`);
      setIsProcessing(false);
      closeConnection();
    }
  };

  // 设置事件源及其监听器
  const setupEventSource = (newClientId) => {
    try {
      // 创建SSE连接
      const sse = new EventSource(`http://localhost:8080/api/generate/connect/${newClientId}`);
      setEventSource(sse);

      // 设置超时处理
      timeoutRef.current = setTimeout(() => {
        if (sse && sse.readyState !== 2) { // 2 表示 CLOSED
          console.error('连接超时');
          setError('连接超时，请稍后重试');
          setIsProcessing(false);
          closeConnection();
        }
      }, CONNECTION_TIMEOUT);

      sse.onmessage = (event) => {
        console.log('接收到消息:', event.data);
      };

      sse.addEventListener('CONNECT', (event) => {
        console.log('SSE连接已建立1:', event.data);

        // 连接成功，重置重试计数
        setRetryCount(0);

        // 清除超时计时器
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // 连接成功后发送生成请求
        const requestData = {
          sourceImageUrl: imageUrl,
          prompt: prompt,
          style: selectedStyle || '默认风格'
        };

        // 创建 AbortController 实例用于取消请求
        const controller = new AbortController();
        setAbortController(controller);

        fetch(`http://localhost:8080/api/generate/image/${newClientId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData),
          signal: controller.signal
        }).catch(err => {
          if (err.name === 'AbortError') {
            console.log('请求被中止');
          } else {
            console.error('发送请求失败:', err);
            setError('发送请求失败: ' + err.message);
            setIsProcessing(false);
            closeConnection();
          }
        });
      });

      sse.addEventListener('PROGRESS', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('处理进度:', data);
          setProgress(data.progress);
        } catch (err) {
          console.error('解析进度数据时出错:', err);
        }
      });

      sse.addEventListener('COMPLETE', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('处理完成:', data);
          debugger
          setResultImage(data.imageUrl);
          setResponseText(data.description);
          setIsProcessing(false);
          closeConnection();
        } catch (err) {
          console.error('解析完成数据时出错:', err);
          setError('处理完成，但解析数据出错');
          setIsProcessing(false);
          closeConnection();
        }
      });

      sse.addEventListener('ERROR', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.error('处理错误:', data);
          setError('处理请求时发生错误: ' + data.description);
          setIsProcessing(false);
          closeConnection();
        } catch (err) {
          console.error('解析错误数据时出错:', err);
          setError('处理请求时发生错误');
          setIsProcessing(false);
          closeConnection();
        }
      });

      sse.onerror = (error) => {
        console.error('SSE连接错误:', error);

        // 如果连接仍在进行中，尝试重试
        if (sse.readyState !== 2) { // 2 表示 CLOSED
          retryConnection();
        } else {
          setError('SSE连接错误');
          setIsProcessing(false);
          closeConnection();
        }
      };

      return sse;
    } catch (err) {
      console.error('创建SSE连接时发生错误:', err);
      setError('创建SSE连接时发生错误: ' + err.message);
      setIsProcessing(false);
      return null;
    }
  };

  // 从服务端获取clientId
  const getOrUseExistingClientId = async () => {
    // 检查是否已经有clientId (从ref或localStorage)
    if (clientIdRef.current) {
      console.log('使用现有clientId:', clientIdRef.current);
      return clientIdRef.current;
    }

    // 也可以从localStorage中获取持久化的clientId
/*    if (!clientIdRef.current) {
      existingClientId = localStorage.getItem('roomDesignerClientId');
    }*/


    try {
      console.log('从服务端获取clientId...');
      const response = await fetch('http://localhost:8080/api/generate/connect');
      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
      const data = await response.json();
      if (!data.clientId) {
        throw new Error('服务端返回数据中没有clientId');
      }
      console.log('获取到clientId:', data.clientId);
      return data.clientId;
    } catch (err) {
      console.error('获取clientId失败:', err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!imageUrl) {
      setError('请输入图片URL');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setResultImage('');
    setResponseText('');

    // 生成唯一客户端ID
    // const newClientId = Date.now().toString();

    // 1. 从服务端获取clientId
    const clientId = await getOrUseExistingClientId();
    console.log('获取到的clientId:', clientId);
    if (!clientId) {
      throw new Error('获取clientId失败');
    }
    // 保存到ref中以便组件内其他地方使用
    clientIdRef.current = clientId;

    try {
      // 关闭之前的连接
      if (eventSource) {
        eventSource.close();
      }

      // 创建新的SSE连接
      console.log('创建SSE连接:', `http://localhost:8080/api/generate/connect/${clientId}`);
      const sse = new EventSource(`http://localhost:8080/api/generate/connect/${clientId}`);

      // 调试所有事件
      sse.onmessage = (event) => {
        console.log('收到通用消息:', event.data);
      };

      // 连接建立
      sse.addEventListener('CONNECT', (event) => {
        console.log('SSE连接已建立2:', event.data);

        // 连接成功后发送生成请求
        fetch(`http://localhost:8080/api/generate/image/${clientId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sourceImageUrl: imageUrl,
            prompt: prompt,
            style: selectedStyle || '默认风格'
          })
        }).catch(err => {
          console.error('发送请求失败:', err);
          setError('发送请求失败: ' + err.message);
          setIsProcessing(false);
          sse.close();
        });
      });

      // 思考
      sse.addEventListener('THINKING', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("THINKING data:", data);
          // 在UI中立即显示初步描述
          console.log("THINKING data:", data.thinking);
          if (data.thinking) {
            setResponseText(data.description);
          }
          setResponseText(data.thinking);
        } catch (err) {
          console.error('解析思考数据出错:', err);
        }
      });

      // 监听 "message" 事件并根据 type 字段区分不同类型的消息
      sse.addEventListener('PROGRESS', (event) => {
        try {
          console.log('原始数据:', event.data);
          const data = JSON.parse(event.data);
          console.log('【进行中】:', data);

          if (data.type === "progress") {
            setProgress(data.progress || 0);
          }
        } catch (err) {
          console.error('解析数据出错:', err);
        }
      });



      // 完成事件
      sse.addEventListener('COMPLETE', (event) => {
        try {
          console.log('原始完成数据:', event.data);
          const data = JSON.parse(event.data);
          console.log('【完成】:', data);

          if (data.imageUrl) {
            setResultImage(data.imageUrl);
          }

          if (data.description) {
            setResponseText(data.description);
          }

          setIsProcessing(false);
          sse.close();
        } catch (err) {
          console.error('解析完成数据出错:', err);
          setError('解析数据时出错: ' + err.message);
          setIsProcessing(false);
          sse.close();
        }
      });

      // 错误事件
      sse.addEventListener('ERROR', (event) => {
        try {
          console.log('原始错误数据:', event.data);
          const data = JSON.parse(event.data);
          console.log('解析后的错误数据:', data);
          setError('处理请求时发生错误: ' + (data.description || '未知错误'));
        } catch (err) {
          console.error('解析错误数据出错:', err);
          setError('处理请求时发生错误');
        } finally {
          setIsProcessing(false);
          sse.close();
        }
      });

      // SSE连接错误
      sse.onerror = (error) => {
        console.error('SSE连接错误:', error);
        setError('SSE连接错误');
        setIsProcessing(false);
        sse.close();
      };

      // 保存SSE实例以便清理
      setEventSource(sse);

    } catch (err) {
      console.error('处理请求时发生错误:', err);
      setError('处理请求时发生错误: ' + err.message);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (isProcessing) {
      setIsProcessing(false);
      closeConnection();
      setError('用户已取消请求');
    }
  };

  return (
      <div className="image-to-image-container">
        <h1>Chat-Edit demo 1.0</h1>

        <div className="input-section">
          <div className="image-input">
            <h2>输入图片URL</h2>
            <input
                type="text"
                value={imageUrl}
                onChange={handleImageUrlChange}
                placeholder="请输入图片URL"
                className="url-input"
                disabled={isProcessing}
            />

            {imageUrl && (
                <div className="image-preview">
                  <h3>预览图</h3>
                  <img src={imageUrl} alt="输入图片" onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';

                  }} />
                </div>
            )}
          </div>

          <div className="prompt-section">
            <h2>设计提示词</h2>

            <div className="style-options">
              <h3>选择风格</h3>
              <div className="style-buttons">
                {STYLE_OPTIONS.map((style, index) => (
                    <button
                        key={index}
                        className={`style-button ${selectedStyle === style ? 'selected' : ''}`}
                        onClick={() => handleStyleSelect(style)}
                        disabled={isProcessing}
                    >
                      {style}
                    </button>
                ))}
              </div>
            </div>

            <div className="prompt-input-container">
              <h3>自定义提示词</h3>
              <textarea
                  value={prompt}
                  onChange={handlePromptChange}
                  placeholder="请输入您的自定义需求描述..."
                  rows={4}
                  className="prompt-textarea"
                  disabled={isProcessing}
              />
            </div>

            <div className="action-buttons">
              <button
                  className="generate-button"
                  onClick={handleSubmit}
                  disabled={isProcessing || !imageUrl}
              >
                {isProcessing ? '处理中...' : '生成图片'}
              </button>

              {isProcessing && (
                  <button
                      className="cancel-button"
                      onClick={handleCancel}
                  >
                    取消请求
                  </button>
              )}
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* 进度条 */}
        {isProcessing && (
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-text">{progress}% 完成</div>
            </div>
        )}

        {/* 结果区域 */}
        {(
            <div className="result-section">
              <h2>生成结果</h2>
              {responseText && (
                  <div className="result-description">
                    <h3>设计说明</h3>
                    <div className="description-text">{displayedText}</div>
                  </div>
              )}
            </div>
        )}


        {resultImage && !isProcessing && (
            <div className="result-section">
              <div className="result-image">
                <img
                    src={resultImage}
                    alt="生成结果"
                    onError={(e) => {
                      console.log('图片加载失败');
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x200?text=结果图片未找到';
                    }}
                />
              </div>
            </div>
        )}
      </div>
  );
};

export default ImageToImage;