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
  employee_name: string ,
  vehicle_id: number | string,
  employee_id: number | string
}
export interface OrderResponse {
  success : boolean,
  message : string,
  data : Object
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: string | number;
  price: string | number;
}

export interface SubDetailResponse {
  order_id: number | string;
  order_date: string;
  delivery_status: string;
  customer_name: string;
  phone: string;
  address: string;
  delivery_note?: string;
  latitude: string | number;
  longitude: string | number;
  items: OrderItem[];
}