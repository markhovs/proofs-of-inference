import type { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails;
        
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.detail || errorBody.message || errorMessage;
          errorDetails = errorBody;
        } catch {
          // If JSON parsing fails, use default message
        }
        
        throw new ApiError(errorMessage, response.status, errorDetails);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return response.text() as any;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      );
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let finalEndpoint = endpoint;
    
    if (params) {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
      finalEndpoint = endpoint + url.search;
    }
    
    return this.request<T>(finalEndpoint, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {      return this.request<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
    }
  
    async delete<T>(endpoint: string): Promise<T> {
      return this.request<T>(endpoint, {
        method: 'DELETE',
      });
    }
  
    // Health check method
    async healthCheck(): Promise<{ status: string }> {
      return this.get('/');
    }
  }
  
  // Create singleton instance
  export const apiClient = new ApiClient();
  export { ApiError };
  export default ApiClient;
