export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Job {
  id: string;
  title: string;
  address: string;
  price: number;
  status: 'pending' | 'delivering' | 'completed' | 'cancelled';
}

// ข้อมูลที่ต้องส่งไปตอน Login
export interface LoginPayload {
  email: string;
  password: string;
}

// ข้อมูลที่ได้รับตอบกลับมาจาก Backend
export interface LoginResponse {
  success: boolean;
  message?: string;
  token: string;
  role_ID: number | string,
  employee_name: string 
}