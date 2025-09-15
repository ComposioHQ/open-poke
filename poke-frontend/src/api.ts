const API_BASE_URL = 'http://localhost:8000';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async createUser(connectionId: string, name?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connection_id: connectionId,
        name,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }

    return response.json();
  }

  async getUser(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }

    return response.json();
  }

  async initiateConnection(userId: string, authConfigId?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/connections/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        auth_config_id: authConfigId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to initiate connection: ${response.statusText}`);
    }

    return response.json();
  }

  async checkConnectionStatus(connectionId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/connections/${connectionId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to check connection status: ${response.statusText}`);
    }

    return response.json();
  }

  async sendMessage(userId: string, content: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserMemory(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/memory`);
    
    if (!response.ok) {
      throw new Error(`Failed to get user memory: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserConversations(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/conversations`);
    
    if (!response.ok) {
      throw new Error(`Failed to get conversations: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();