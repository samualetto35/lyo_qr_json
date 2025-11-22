import Cookies from 'js-cookie';
import api from './api';

export interface User {
  id: string;
  role: 'admin' | 'teacher';
  email: string;
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export const authService = {
  async loginAdmin(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/admin/login', { email, password });
    const data = response.data;

    // Store tokens and user info
    Cookies.set('access_token', data.access_token, { expires: 1/48 }); // 30 min
    Cookies.set('refresh_token', data.refresh_token, { expires: 30 });
    Cookies.set('user', JSON.stringify(data.user), { expires: 30 });

    return data;
  },

  async loginTeacher(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/teacher/login', { email, password });
    const data = response.data;

    Cookies.set('access_token', data.access_token, { expires: 1/48 });
    Cookies.set('refresh_token', data.refresh_token, { expires: 30 });
    Cookies.set('user', JSON.stringify(data.user), { expires: 30 });

    return data;
  },

  logout() {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    Cookies.remove('user');
  },

  getUser(): User | null {
    const userCookie = Cookies.get('user');
    if (!userCookie) return null;
    try {
      return JSON.parse(userCookie);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!Cookies.get('access_token');
  },
};

