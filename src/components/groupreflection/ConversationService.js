const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function callClaude(systemPrompt, messages) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/claude/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        systemPrompt,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API Error');
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}