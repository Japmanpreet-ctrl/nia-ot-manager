export type UserRole = 'admin' | 'doctor' | 'nurse' | 'data_entry';

export type Gender = 'Male' | 'Female' | 'Other';

export interface AppUser {
  id: string;
  firebase_uid: string;
  email: string;
  full_name: string;
  role: UserRole;
  role_level?: number | null;
  created_at: string;
}

export interface OTRecord {
  id: string;
  opd_number?: string | null;
  ipd_number?: string | null;
  patient_name: string;
  gender: Gender;
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

export const roles = ['admin', 'doctor', 'nurse', 'data_entry'] as const;
