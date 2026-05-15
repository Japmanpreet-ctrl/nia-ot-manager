export type UserRole = 'admin' | 'doctor' | 'nurse' | 'data_entry';

export type PermissionAction =
  | 'view_records'
  | 'add_record'
  | 'edit_record'
  | 'delete_record'
  | 'view_analytics'
  | 'view_operations'
  | 'view_inventory'
  | 'manage_linen'
  | 'export_pdf'
  | 'access_admin';

export type AnesthesiaType =
  | 'General'
  | 'Spinal'
  | 'Epidural'
  | 'Local'
  | 'Combined Spinal-Epidural'
  | 'Regional'
  | 'MAC'
  | 'Other';

export interface OTRecord {
  id: string;
  opd_number?: string | null;
  ipd_number?: string | null;
  patient_name: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  diagnosis: string;
  surgical_procedure: string;
  anesthesia_type: string;
  ot_date: string;
  ot_start_time: string;
  final_case_time?: string | null;
  consultant_name: string;
  anesthetist_name: string;
  first_assistant?: string | null;
  second_assistant?: string | null;
  notes?: string | null;
  created_by_uid?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OTRecordInput {
  opd_number?: string | null;
  ipd_number?: string | null;
  patient_name: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  diagnosis: string;
  surgical_procedure: string;
  anesthesia_type: string;
  ot_date: string;
  ot_start_time: string;
  final_case_time?: string | null;
  consultant_name: string;
  anesthetist_name: string;
  first_assistant?: string | null;
  second_assistant?: string | null;
  notes?: string | null;
}

export interface AppUser {
  id: string;
  firebase_uid: string;
  email: string;
  full_name: string;
  role: UserRole;
  role_level?: number | null;
  created_at?: string;
}

export interface PaginatedRecords {
  data: OTRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AnalyticsSummary {
  today_count: number;
  month_count: number;
  year_count: number;
  earliest_ot_today: string | null;
  latest_case_today: string | null;
  occupancy_rate_today: number;
  downtime_today: string;
}

export interface MonthlyAnalytics {
  daily: Array<{
    date: string;
    day: number;
    cases: number;
    first_case_time: string | null;
    last_case_time: string | null;
    occupied_minutes: number;
    downtime_minutes: number;
    occupancy_rate: number;
    first_ot_start: string | null;
    final_case_time: string | null;
  }>;
  anesthesiaBreakdown: Array<{ name: string; value: number }>;
}

export interface YearlyAnalytics {
  monthly: Array<{ month: number; label: string; cases: number; cumulative: number; top_consultant: string }>;
  topConsultants: Array<{ name: string; cases: number }>;
}

export const anesthesiaOptions: AnesthesiaType[] = [
  'General',
  'Spinal',
  'Epidural',
  'Local',
  'Combined Spinal-Epidural',
  'Regional',
  'MAC',
  'Other'
];

export interface OperationsOverview {
  date: string;
  inventory: Array<{ category: string; item: string; stock: number | string; unit: string; reorder_level: number | string; status: string; shortage?: number }>;
  sterilization: Array<{ set_name: string; method: string; cycle: string; indicator: string; released_by: string; time: string }>;
  fumigation: Array<{ area: string; method: string; started_at: string; completed_at: string; next_due: string; status: string }>;
  culture: Array<{ ot_name?: string; sample: string; site: string; collected_on: string; result: string; status: string }>;
  articles: Array<{ item_name: string; category: string; asset_tag: string; location: string; purchase_date: string; warranty_expiry: string; next_maintenance_date: string; status: string }>;
  updated_by?: string;
  updated_at?: string;
}

/* ─── OT Linen ─── */

export type LinenStatus = 'Available' | 'In Laundry' | 'Damaged' | 'Out of Stock' | 'Low Stock';
export type LaundryStatus = 'Sent' | 'Partially Returned' | 'Returned' | 'Lost';

export interface OtLinenItem {
  id: string;
  item_name: string;
  category: string;
  quantity_available: number;
  in_laundry: number;
  damaged: number;
  minimum_threshold: number;
  unit: string;
  status: LinenStatus;
  notes?: string | null;
  is_deleted: boolean;
  created_by_uid?: string | null;
  created_by_name?: string | null;
  updated_by_uid?: string | null;
  updated_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OtLinenItemInput {
  item_name: string;
  category: string;
  quantity_available: number;
  in_laundry?: number;
  damaged?: number;
  minimum_threshold: number;
  unit: string;
  notes?: string | null;
}

export interface OtLinenLaundryLog {
  id: string;
  linen_item_id: string;
  quantity_sent: number;
  date_sent: string;
  expected_return_date: string;
  returned_quantity: number;
  pending_quantity: number;
  laundry_status: LaundryStatus;
  notes?: string | null;
  sent_by_uid?: string | null;
  sent_by_name?: string | null;
  updated_by_uid?: string | null;
  updated_by_name?: string | null;
  created_at: string;
  updated_at: string;
  ot_linen_items?: { item_name: string; category: string; unit: string };
}

export interface OtLinenStats {
  total_items: number;
  total_available: number;
  total_in_laundry: number;
  total_damaged: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface OtLinenAuditLog {
  id: string;
  linen_item_id: string | null;
  action: string;
  quantity_change?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  performed_by_uid?: string | null;
  performed_by_name?: string | null;
  created_at: string;
  ot_linen_items?: { item_name: string; category: string } | null;
}

export interface PaginatedLinenItems {
  data: OtLinenItem[];
  total: number;
  page: number;
  totalPages: number;
}
