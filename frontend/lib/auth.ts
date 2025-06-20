interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  role: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

class AuthService {
  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const authData: AuthResponse = await response.json();
    
    // Store token and user data
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    localStorage.setItem('isAuthenticated', 'true');

    return authData;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const authData: AuthResponse = await response.json();
    
    // Store token and user data
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    localStorage.setItem('isAuthenticated', 'true');

    return authData;
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      //'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.logout();
      window.location.href = '/auth/login';
    }

    return response;
  }

  async adminCreateUser(data: RegisterData): Promise<User> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'User creation failed');
    }
    return await response.json();
  }

  async changePassword(data: ChangePasswordData): Promise<any> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password change failed');
    }
    return await response.json();
  }
}

export const authService = new AuthService();
export type { User, AuthResponse, LoginData, RegisterData, ChangePasswordData };