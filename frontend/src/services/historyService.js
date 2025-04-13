const API_BASE_URL = 'http://localhost:8080/api';

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const historyService = {
    getAllSessions: async (page = 0, size = 10) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/history/sessions?page=${page}&size=${size}`
            );
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            throw error;
        }
    },

    getSessionDetails: async (sessionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/history/sessions/${sessionId}`);
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching session details:', error);
            throw error;
        }
    },

    deleteSession: async (sessionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/history/sessions/${sessionId}`, {
                method: 'DELETE'
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error deleting session:', error);
            throw error;
        }
    },

    updateSessionStatus: async (sessionId, status) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/history/sessions/${sessionId}/status`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status })
                }
            );
            return handleResponse(response);
        } catch (error) {
            console.error('Error updating session status:', error);
            throw error;
        }
    },

    addResponse: async (sessionId, response) => {
        try {
            const result = await fetch(
                `${API_BASE_URL}/history/sessions/${sessionId}/responses`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(response)
                }
            );
            return handleResponse(result);
        } catch (error) {
            console.error('Error adding response:', error);
            throw error;
        }
    }
}; 