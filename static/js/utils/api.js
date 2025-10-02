// =============================================
// API UTILITIES - SINGLE SOURCE FOR ALL API CALLS
// =============================================

class MytroAPI {
  constructor() {
    this.baseURL = '';
    this.cache = new Map();
  }

  // Get CSRF token
  getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
  }

  // Generic fetch with error handling
  async fetch(url, options = {}) {
    const defaultOptions = {
      headers: {
        'X-CSRFToken': this.getCSRFToken(),
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin'
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // POST methods
  async post(url, data) {
    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // GET methods with caching
  async get(url, useCache = true) {
    if (useCache && this.cache.has(url)) {
      return this.cache.get(url);
    }

    const data = await this.fetch(url);
    
    if (useCache) {
      this.cache.set(url, data);
      setTimeout(() => this.cache.delete(url), 300000); // 5 minutes
    }
    
    return data;
  }

  // File upload
  async uploadFile(url, formData) {
    return this.fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRFToken': this.getCSRFToken()
      }
    });
  }

  // Specific API methods
  async likePost(postId) {
    return this.post(`/api/like_post/${postId}/`);
  }

  async addComment(postId, comment) {
    return this.post('/api/add_comment/', { post_id: postId, comment });
  }

  async followUser(userId) {
    return this.post(`/api/follow/${userId}/`);
  }

  async createPost(formData) {
    return this.uploadFile('/api/create_post/', formData);
  }

  async editPost(postId, formData) {
    return this.uploadFile(`/api/edit_post/${postId}/`, formData);
  }
}

// Global API instance
window.mytroAPI = new MytroAPI();