const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const apiCall = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Error');
  }

  return data;
};

export const authAPI = {
  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (email, password, name, role = 'student') =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role })
    }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  }
};

export const groupReflectionsAPI = {
  getAll: () => apiCall('/group-reflections'),
  getById: (id) => apiCall(`/group-reflections/${id}`),
  create: (data) => apiCall('/group-reflections', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const doublebotAPI = {
  start: (reflectionId) => apiCall('/doublebot/start', {
    method: 'POST',
    body: JSON.stringify({ reflectionId })
  }),
  continue: (reflectionId) => apiCall('/doublebot/continue', {
    method: 'POST',
    body: JSON.stringify({ reflectionId })
  }),
  analyze: (reflectionId) => apiCall('/doublebot/analyze', {
    method: 'POST',
    body: JSON.stringify({ reflectionId })
  }),
  message: (reflectionId, userMessage) => apiCall('/doublebot/message', {
    method: 'POST',
    body: JSON.stringify({ reflectionId, userMessage })
  })
};

export const instructorAPI = {
  getStudents: () => apiCall('/instructor/students'),
  getReflections: () => apiCall('/instructor/reflections'),
  getStats: () => apiCall('/instructor/stats')
};

export default {
  auth: authAPI,
  groupReflections: groupReflectionsAPI,
  doublebot: doublebotAPI,
  instructor: instructorAPI
};
