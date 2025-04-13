const API_BASE_URL = 'http://localhost:8080/api';

const processRequest = async (imageUrl, prompt) => {
  const response = await fetch(`${API_BASE_URL}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl,
      prompt,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to process request');
  }
  
  return response.json();
};

export { processRequest };