export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  customer_name: string;
  mobile: string;
  email: string | null;
  business_name: string | null;
  gst_number: string | null;
  customer_type: CustomerType;
  address: string | null;
  status: CustomerStatus;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: number;
  customer_id: number;
  note: string;
  follow_up_date: string | null;
  created_by: number | null;
  created_by_name?: string;
  created_at: string;
}

export interface Product {
  id: number;
  product_name: string;
  sku: string;
  category: string;
  unit_price: number | string;
  current_stock: number;
  minimum_stock: number;
  warehouse_location: string | null;
  is_low_stock?: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  quantity_changed: number;
  movement_type: MovementType;
  reason: string;
  created_by: number | null;
  created_by_name?: string;
  created_at: string;
}

export interface ChallanItem {
  id: number;
  challan_id: number;
  product_id: number;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: number | string;
  quantity: number;
  total_price: number | string;
}

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name?: string;
  business_name?: string;
  customer_mobile?: string;
  gst_number?: string;
  customer_address?: string;
  total_quantity: number;
  total_amount?: number | string;
  status: ChallanStatus;
  created_by: number | null;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items?: ChallanItem[];
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  lowStockProductsCount: number;
  draftChallansCount: number;
  confirmedChallansCount: number;
  recentChallans: Challan[];
  recentStockMovements: StockMovement[];
  lowStockProducts: Product[];
}
