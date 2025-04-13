import React, { useState } from 'react';
import ResponseDisplay from './ResponseDisplay';
import { processRequest } from '../services/api';

const EXAMPLE_PROMPTS = [
  "Describe this room in detail",
  "Redesign this room with a modern minimalist style",
  "Design this room as a Scandinavian living room",
  "Remove all furniture from this image",
  "What room types and styles are available?"
];

const RoomDesigner = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);

  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageUrl) {
      setError('Please provide an image URL');
      return;
    }
    
    if (!prompt) {
      setError('Please enter a prompt');
      return;
    }
    
    try {
      setError(null);
      setSessionId(null);
      setIsProcessing(true);
      
      const response = await processRequest(imageUrl, prompt);
      console.log('Process response:', response);
      
      if (response && response.sessionId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setSessionId(response.sessionId);
      } else {
        throw new Error('No session ID received from server');
      }
    } catch (err) {
      console.error('Process error:', err);
      setError('Error processing request: ' + (err.message || 'Unknown error'));
      setIsProcessing(false);
      setSessionId(null);
    }
  };

  const handleExampleClick = (examplePrompt) => {
    setPrompt(examplePrompt);
  };

  const handleProcessingComplete = () => {
    console.log('Processing complete');
    setIsProcessing(false);
  };

  return (
    <div className="room-designer-container">
      <div className="input-section">
        <div className="image-input-container">
          <h2>Room Image URL</h2>
          
          <div className="input-group">
            <label>Enter Image URL:</label>
            <input
              type="text"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="https://example.com/room-image.jpg"
              className="url-input"
            />
          </div>
          
          {imageUrl && (
            <div className="image-preview">
              <h3>Image Preview</h3>
              <img src={imageUrl} alt="Room" />
            </div>
          )}
        </div>
        
        <div className="prompt-section">
          <h2>Enter your prompt</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder="Enter your instructions for the AI..."
                rows={4}
                className="prompt-input"
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={isProcessing || !imageUrl}
            >
              {isProcessing ? 'Processing...' : 'Process Image'}
            </button>
          </form>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="example-prompts">
            <h3>Example prompts:</h3>
            <ul>
              {EXAMPLE_PROMPTS.map((examplePrompt, index) => (
                <li key={index}>
                  <button 
                    onClick={() => handleExampleClick(examplePrompt)}
                    className="example-prompt-button"
                  >
                    {examplePrompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {sessionId && (
        <ResponseDisplay 
          sessionId={sessionId} 
          isProcessing={isProcessing}
          onProcessingComplete={handleProcessingComplete}
        />
      )}
    </div>
  );
};

export default RoomDesigner;