const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/api/ws';

// Stable anonymous voter device fingerprint
export const getFingerprint = (): string => {
  let fp = localStorage.getItem('votexa_device_fp');
  if (!fp) {
    fp = 'vtx_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('votexa_device_fp', fp);
  }
  return fp;
};

const getHeaders = (requiresAuth = false): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Voter-Fingerprint': getFingerprint(),
  };

  if (requiresAuth) {
    const token = localStorage.getItem('votexa_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

export const api = {
  // Auth
  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid credentials');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Session expired');
    return data;
  },

  // Usage & Plans
  async getUsage() {
    const res = await fetch(`${API_BASE}/account/usage`, {
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch usage');
    return data;
  },

  async getPlans() {
    const res = await fetch(`${API_BASE}/plans`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async upgradePlan(plan: 'free' | 'premium', adminSecretKey?: string) {
    const res = await fetch(`${API_BASE}/plans/upgrade`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ plan, adminSecretKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upgrade failed');
    return data;
  },

  // Polls
  async createPoll(payload: {
    question: string;
    description?: string;
    options: string[];
    settings: any;
  }) {
    const res = await fetch(`${API_BASE}/polls`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.message || data.error || 'Failed to create poll');
      err.code = data.error;
      err.data = data;
      throw err;
    }
    return data;
  },

  async getUserPolls() {
    const res = await fetch(`${API_BASE}/polls`, {
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch polls');
    return data.polls || [];
  },

  async getPublicPoll(code: string) {
    const res = await fetch(`${API_BASE}/polls/public/${code}`, {
      headers: getHeaders(true), // Passes token if logged in
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Poll not found');
    return data;
  },

  async castVote(code: string, optionId: string, voterName?: string) {
    const res = await fetch(`${API_BASE}/polls/public/${code}/vote`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        optionId,
        clientFingerprint: getFingerprint(),
        voterName: voterName || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.message || data.error || 'Failed to record vote');
      err.code = data.error;
      throw err;
    }
    return data;
  },

  async getPollVotes(code: string) {
    const res = await fetch(`${API_BASE}/polls/public/${code}/votes`, {
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch voter activity');
    return data.votes || [];
  },

  async closePoll(code: string) {
    const res = await fetch(`${API_BASE}/polls/${code}/close`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to close poll');
    return data;
  },

  async deletePoll(code: string) {
    const res = await fetch(`${API_BASE}/polls/${code}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete poll');
    return data;
  },

  getExportUrl(code: string) {
    return `${API_BASE}/polls/${code}/export`;
  },

  getWebSocketUrl(code: string) {
    return `${WS_BASE}/polls/${code}`;
  }
};
