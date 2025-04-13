import React from 'react';

const ResponseDisplay = ({ imageUrl, prompt }) => {
  return (
    <div className="response-display">
      <h3>Generated Room Design</h3>
      <div className="image-container">
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={`Room design based on: ${prompt}`} 
            className="generated-image"
          />
        )}
      </div>
      <div className="prompt-display">
        <p><strong>Design Prompt:</strong> {prompt}</p>
      </div>
    </div>
  );
};

export default ResponseDisplay;