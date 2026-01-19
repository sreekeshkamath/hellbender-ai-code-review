import axios, { AxiosInstance, AxiosResponse } from 'axios';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:3001') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: errorMessage,
          error: error
        });
        // Create a more descriptive error
        const apiError = new Error(errorMessage);
        (apiError as any).status = error.response?.status;
        (apiError as any).response = error.response;
        return Promise.reject(apiError);
      }
    );
  }

  async get<T = any>(url: string, params?: any, timeout?: number): Promise<T> {
    const config = { params, ...(timeout && { timeout }) };
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, timeout?: number): Promise<T> {
    const config = timeout ? { timeout } : undefined;
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url);
    return response.data;
  }
}

// Export a default instance
export const apiClient = new ApiClient();