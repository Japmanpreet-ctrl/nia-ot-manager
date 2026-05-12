export type UserRole = 'admin' | 'doctor' | 'nurse' | 'data_entry';

export type PermissionAction =
  | 'view_records'
  | 'add_record'
  | 'edit_record'
  | 'delete_record'
  | 'view_analytics'
  | 'view_operations'
  | 'view_inventory'
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
  culture: Array<{ sample: string; site: string; collected_on: string; result: string; status: string }>;
  updated_by?: string;
  updated_at?: string;
}
