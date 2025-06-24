// API Configuration - Handle both internal and external URLs for Railway
const getBackendUrl = () => {
  // For server-side rendering (internal Railway communication)
  if (typeof window === 'undefined') {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    // Ensure protocol is included
    if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      return `https://${backendUrl}`;
    }
    return backendUrl;
  }
  
  // For client-side (browser requests) - use public URL
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  
  // Ensure protocol is included
  let finalUrl = backendUrl;
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = `https://${finalUrl}`;
  }
  
  // If it's a Railway internal URL, we need the public version for browser requests
  if (finalUrl.includes('.railway.internal')) {
    // Try to get the public URL from environment or construct it
    const publicUrl = process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL;
    if (publicUrl) {
      return publicUrl.startsWith('http') ? publicUrl : `https://${publicUrl}`;
    }
    
    // If no public URL is set, assume it follows Railway pattern
    console.warn('Using internal Railway URL for browser requests. Set NEXT_PUBLIC_BACKEND_PUBLIC_URL for production.');
    return finalUrl.replace('.railway.internal', '.up.railway.app');
  }
  
  return finalUrl;
};

const API_BASE_URL = `${getBackendUrl()}/api`;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add session ID for view tracking
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('sessionId', sessionId);
    }
    headers['X-Session-ID'] = sessionId;

    return headers;
  }

  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        let errorData = null;
        
        try {
          errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // Handle rate limiting
          if (response.status === 429) {
            const cooldownMinutes = errorData.cooldownMinutes || 1;
            const isAuth = errorData.isAuthenticated || false;
            const hint = errorData.hint || '';
            
            if (typeof window !== 'undefined') {
              // Store rate limit info for UI
              localStorage.setItem('rateLimitInfo', JSON.stringify({
                message: errorMessage,
                cooldownMinutes,
                isAuthenticated: isAuth,
                hint,
                timestamp: Date.now()
              }));
              
              // Show user-friendly message
              if (!isAuth && hint) {
                errorMessage += `\n${hint}`;
              }
            }
            
            throw new Error(errorMessage);
          }
          
          // Check if user is banned
          if (errorData.banned && response.status === 403) {
            // Clear tokens and redirect to login with banned message
            this.logout();
            if (typeof window !== 'undefined') {
              localStorage.setItem('bannedMessage', errorMessage);
              window.location.href = '/login';
            }
            throw new Error(errorMessage);
          }
          
          // Check if user needs verification
          if (errorData.needsVerification && response.status === 403) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('verificationMessage', errorMessage);
            }
            throw new Error(errorMessage);
          }
        } catch (parseError) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth methods
  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<{ user: any; token: string }> {
    const response = await this.apiRequest<any>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return { user: response.user, token: response.token };
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: any; token: string }> {
    const response = await this.apiRequest<any>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return { user: response.user, token: response.token };
  }

  async verify(): Promise<{ user: any }> {
    const response = await this.apiRequest<any>('/auth/verify');
    return { user: response.user };
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Posts methods
  async getPosts(): Promise<any[]> {
    const response = await this.apiRequest<any>('/posts');
    const posts = response.posts || [];
    
    // Normalize userLiked to userHasLiked for frontend compatibility
    return posts.map((post: any) => ({
      ...post,
      userHasLiked: post.userLiked
    }));
  }

  async getPost(id: string): Promise<any> {
    const response = await this.apiRequest<any>(`/posts/${id}`);
    
    // Normalize userLiked to userHasLiked for frontend compatibility
    if (response.post && response.post.userLiked !== undefined) {
      response.post.userHasLiked = response.post.userLiked;
    }
    
    return response; // Return full response with post and comments
  }

  async createPost(postData: {
    title: string;
    content: string;
    anonymous?: boolean;
  }): Promise<any> {
    // Convert anonymous to isAnonymous for backend compatibility
    const backendData = {
      title: postData.title,
      content: postData.content,
      isAnonymous: postData.anonymous || false
    };
    
    const response = await this.apiRequest<any>(
      '/posts',
      {
        method: 'POST',
        body: JSON.stringify(backendData),
      }
    );
    return response.post;
  }

  async likePost(postId: string): Promise<any> {
    const response = await this.apiRequest<any>(
      `/posts/${postId}/like`,
      {
        method: 'POST',
      }
    );
    
    // Normalize response for frontend compatibility
    return {
      ...response,
      userHasLiked: response.userLiked // Map userLiked to userHasLiked
    };
  }

  async createComment(postId: string, commentData: {
    content: string;
    anonymous?: boolean;
  }): Promise<any> {
    const backendData = {
      content: commentData.content,
      isAnonymous: commentData.anonymous || false
    };
    
    const response = await this.apiRequest<any>(
      `/posts/${postId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(backendData),
      }
    );
    return response.comment;
  }

  async blockUserOld(userId: string): Promise<any> {
    const response = await this.apiRequest<any>(`/admin/users/${userId}/block`, {
      method: 'POST',
    });
    return { success: true, ...response };
  }

  async verifyUser(userId: string): Promise<any> {
    const response = await this.apiRequest<any>(`/admin/users/${userId}/verify`, {
      method: 'POST',
    });
    return { success: true, ...response };
  }

  async unverifyUser(userId: number): Promise<any> {
    const response = await this.apiRequest<any>(`/admin/users/${userId}/unverify`, {
      method: 'POST',
    });
    return response;
  }

  async deletePost(postId: string): Promise<any> {
    await this.apiRequest(`/admin/posts/${postId}`, {
      method: 'DELETE',
    });
    return { success: true };
  }

  async deanonymizePost(postId: string): Promise<any> {
    const response = await this.apiRequest<any>(
      `/admin/posts/${postId}/deanonymize`
    );
    return { success: true, ...response };
  }

  async deanonymizePostById(postId: number): Promise<any> {
    const response = await this.apiRequest<any>(
      `/admin/posts/${postId}/deanonymize`
    );
    return { success: true, ...response };
  }

  async getPostDetails(postId: string): Promise<any> {
    const response = await this.apiRequest<any>(`/admin/posts/${postId}`);
    return { success: true, ...response };
  }

  async deanonymizeComment(commentId: string): Promise<any> {
    const response = await this.apiRequest<any>(`/admin/comments/${commentId}/deanonymize`);
    return response;
  }

  // Enhanced surveillance and moderation methods
  async blockUser(userId: number): Promise<any> {
    const response = await this.apiRequest<any>(
      `/admin/users/${userId}/block`,
      { method: 'POST' }
    );
    return response;
  }

  async unblockUser(userId: number): Promise<any> {
    const response = await this.apiRequest<any>(
      `/admin/users/${userId}/unblock`,
      { method: 'POST' }
    );
    return response;
  }

  async deleteUser(userId: number): Promise<any> {
    const response = await this.apiRequest<any>(
      `/admin/users/${userId}`,
      { method: 'DELETE' }
    );
    return response;
  }

  async addUserToWatchlist(userId: number): Promise<any> {
    const response = await this.apiRequest<any>(
      `/admin/users/${userId}/watchlist`,
      { method: 'POST' }
    );
    return response;
  }

  async hidePost(postId: number): Promise<any> {
    const response = await this.apiRequest<any>(
      `/admin/posts/${postId}/hide`,
      { method: 'POST' }
    );
    return response;
  }

  async unhidePost(postId: number): Promise<any> {
    const response = await this.apiRequest<any>(
      `/admin/posts/${postId}/unhide`,
      { method: 'POST' }
    );
    return response;
  }

  async flagPost(postId: number): Promise<any> {
    const response = await this.apiRequest<any>(
      `/admin/posts/${postId}/flag`,
      { method: 'POST' }
    );
    return response;
  }

  async analyzePostToxicity(postId: number): Promise<any> {
    const response = await this.apiRequest<any>(
      `/admin/posts/${postId}/analyze-toxicity`,
      { method: 'POST' }
    );
    return response;
  }

  async bulkDeanonymize(postIds: number[]): Promise<any> {
    const response = await this.apiRequest<any>(
      '/admin/posts/bulk-deanonymize',
      {
        method: 'POST',
        body: JSON.stringify({ postIds }),
      }
    );
    return response;
  }

  async getUserSurveillanceData(userId: number): Promise<any> {
    const response = await this.apiRequest<any>(`/admin/users/${userId}/surveillance`);
    return response;
  }

  async getSuspiciousActivity(): Promise<any> {
    const response = await this.apiRequest<any>('/admin/surveillance/suspicious-activity');
    return response;
  }

  async getSecurityStats(): Promise<any> {
    const response = await this.apiRequest<any>('/admin/surveillance/security-stats');
    return response;
  }

  async trackUserBehavior(userId: number, action: string, metadata: any): Promise<any> {
    const response = await this.apiRequest<any>(
      '/admin/surveillance/track-behavior',
      {
        method: 'POST',
        body: JSON.stringify({ userId, action, metadata }),
      }
    );
    return response;
  }

  async getRealTimeActivity(): Promise<any> {
    const response = await this.apiRequest<any>('/admin/surveillance/real-time-activity');
    return response;
  }

  async emergencyLockdown(): Promise<any> {
    const response = await this.apiRequest<any>(
      '/admin/emergency/lockdown',
      { method: 'POST' }
    );
    return response;
  }

  async getIPAnalysis(ipAddress: string): Promise<any> {
    const response = await this.apiRequest<any>(`/admin/surveillance/ip-analysis/${encodeURIComponent(ipAddress)}`);
    return response;
  }

  async getBehaviorPatterns(userId: number): Promise<any> {
    const response = await this.apiRequest<any>(`/admin/surveillance/behavior-patterns/${userId}`);
    return response;
  }

  async deleteAdminPost(postId: number) {
    return this.apiRequest(`/admin/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Admin data methods
  async getAdminUsers(): Promise<any> {
    const response = await this.apiRequest<any>('/admin/users');
    return response.users || [];
  }

  async getAdminPosts(): Promise<any> {
    const response = await this.apiRequest<any>('/admin/posts');
    return response.posts || [];
  }
}

export const api = new ApiClient();

// Backward compatibility exports
export const auth = {
  register: (userData: { username: string; email: string; password: string }) => api.register(userData),
  login: (credentials: { email: string; password: string }) => api.login(credentials),
  verify: () => api.verify(),
  logout: () => api.logout(),
  isAuthenticated: () => !!localStorage.getItem('token')
};

export const posts = {
  getAll: () => api.getPosts(),
  getById: (id: string) => api.getPost(id),
  create: (postData: { title: string; content: string; anonymous?: boolean }) => api.createPost(postData),
  like: (id: string) => api.likePost(id),
  createComment: (postId: string, commentData: { content: string; anonymous?: boolean }) => api.createComment(postId, commentData)
};

export const admin = {
  getUsers: () => api.getAdminUsers(),
  getPosts: () => api.getAdminPosts(),
  getPostDetails: (postId: string) => api.getPostDetails(postId),
  blockUserOld: (userId: string) => api.blockUserOld(userId),
  verifyUser: (userId: number) => api.verifyUser(userId.toString()),
  unverifyUser: (userId: number) => api.unverifyUser(userId),
  deletePost: (postId: string) => api.deletePost(postId),
  deanonymizePost: (postId: number) => api.deanonymizePostById(postId),
  deanonymizeComment: (commentId: string) => api.deanonymizeComment(commentId),
  blockUser: (userId: number) => api.blockUser(userId),
  unblockUser: (userId: number) => api.unblockUser(userId),
  addUserToWatchlist: (userId: number) => api.addUserToWatchlist(userId),
  hidePost: (postId: number) => api.hidePost(postId),
  unhidePost: (postId: number) => api.unhidePost(postId),
  flagPost: (postId: number) => api.flagPost(postId),
  analyzePostToxicity: (postId: number) => api.analyzePostToxicity(postId),
  bulkDeanonymize: (postIds: number[]) => api.bulkDeanonymize(postIds),
  getUserSurveillanceData: (userId: number) => api.getUserSurveillanceData(userId),
  getSuspiciousActivity: () => api.getSuspiciousActivity(),
  getSecurityStats: () => api.getSecurityStats(),
  trackUserBehavior: (userId: number, action: string, metadata: any) => api.trackUserBehavior(userId, action, metadata),
  getRealTimeActivity: () => api.getRealTimeActivity(),
  emergencyLockdown: () => api.emergencyLockdown(),
  getIPAnalysis: (ipAddress: string) => api.getIPAnalysis(ipAddress),
  getBehaviorPatterns: (userId: number) => api.getBehaviorPatterns(userId),
  deleteAdminPost: (postId: number) => api.deleteAdminPost(postId),
  deleteUser: (userId: number) => api.deleteUser(userId)
};

export default api; 