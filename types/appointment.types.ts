// ==================== Core Appointment Types ====================

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentPriority = 'normal' | 'urgent' | 'follow_up';
export type ViewMode = 'day' | 'week' | 'month' | 'list';

export interface BaseAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  notes?: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AppointmentWithPatient extends BaseAppointment {
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  patient_address?: string;
}

export interface AppointmentWithDoctor extends BaseAppointment {
  doctor_name?: string;
  doctor_specialization?: string;
  doctor_phone?: string;
}

export interface AppointmentWithDetails extends AppointmentWithPatient, AppointmentWithDoctor {}

// ==================== Form & Input Types ====================

export interface CreateAppointmentInput {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  priority?: AppointmentPriority;
  notes?: string;
}

export interface UpdateAppointmentInput {
  patient_id?: string;
  appointment_date?: string;
  appointment_time?: string;
  status?: AppointmentStatus;
  priority?: AppointmentPriority;
  notes?: string;
  reminder_sent?: boolean;
}

export interface AppointmentFormData {
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  priority: AppointmentPriority;
  notes: string;
}

// ==================== Filter & Search Types ====================

export interface AppointmentFilters {
  doctorId?: string;
  patientId?: string;
  status?: AppointmentStatus | 'all';
  priority?: AppointmentPriority | 'all';
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface AppointmentSearchParams {
  query?: string;
  status?: AppointmentStatus;
  priority?: AppointmentPriority;
  dateFrom?: string;
  dateTo?: string;
}

// ==================== Statistics Types ====================

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  no_show: number;
  todayAppointments: number;
  upcomingAppointments: number;
}

export interface DailyStats {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  no_show: number;
}

export interface MonthlyStats {
  month: string;
  totalAppointments: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
}

// ==================== Time Slot Types ====================

export interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: AppointmentWithDetails;
}

export interface DaySchedule {
  date: string;
  slots: TimeSlot[];
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
}

export interface WeekSchedule {
  weekStart: string;
  weekEnd: string;
  days: DaySchedule[];
}

// ==================== Calendar Types ====================

export interface CalendarDay {
  date: Date;
  dateString: string;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  appointments: AppointmentWithDetails[];
  appointmentCount: number;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarWeek[];
}

// ==================== Notification Types ====================

export interface AppointmentReminder {
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  reminderType: 'sms' | 'email' | 'whatsapp';
  sent: boolean;
  sentAt?: string;
}

export interface AppointmentNotification {
  id: string;
  appointmentId: string;
  type: 'created' | 'updated' | 'cancelled' | 'reminder' | 'completed';
  message: string;
  read: boolean;
  createdAt: string;
}

// ==================== Conflict & Validation Types ====================

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingAppointment?: AppointmentWithDetails;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// ==================== Component Props Types ====================

export interface AppointmentSystemProps {
  doctorId: string;
  userRole: 'secretary' | 'doctor' | 'admin';
  initialView?: ViewMode;
  onAppointmentSelect?: (appointment: AppointmentWithDetails) => void;
  onAppointmentCreate?: (appointment: AppointmentWithDetails) => void;
  onAppointmentUpdate?: (appointment: AppointmentWithDetails) => void;
  onAppointmentDelete?: (appointmentId: string) => void;
}

export interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  onEdit?: (appointment: AppointmentWithDetails) => void;
  onDelete?: (appointmentId: string) => void;
  onStatusChange?: (appointmentId: string, status: AppointmentStatus) => void;
  compact?: boolean;
  showActions?: boolean;
}

export interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: AppointmentWithDetails;
  doctorId: string;
  onSave: (data: CreateAppointmentInput | UpdateAppointmentInput) => Promise<void>;
  mode: 'create' | 'edit';
}

export interface TimeSlotGridProps {
  date: string;
  doctorId: string;
  slots: TimeSlot[];
  onSlotClick: (slot: TimeSlot) => void;
  startHour?: number;
  endHour?: number;
}

// ==================== API Response Types ====================

export interface AppointmentResponse {
  data: AppointmentWithDetails | null;
  error: Error | null;
}

export interface AppointmentsResponse {
  data: AppointmentWithDetails[];
  error: Error | null;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface AppointmentStatsResponse {
  data: AppointmentStats | null;
  error: Error | null;
}

// ==================== Action Types ====================

export type AppointmentAction = 
  | { type: 'SET_APPOINTMENTS'; payload: AppointmentWithDetails[] }
  | { type: 'ADD_APPOINTMENT'; payload: AppointmentWithDetails }
  | { type: 'UPDATE_APPOINTMENT'; payload: AppointmentWithDetails }
  | { type: 'DELETE_APPOINTMENT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_DATE'; payload: Date }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_FILTERS'; payload: AppointmentFilters }
  | { type: 'SET_STATS'; payload: AppointmentStats };

// ==================== State Types ====================

export interface AppointmentState {
  appointments: AppointmentWithDetails[];
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  viewMode: ViewMode;
  filters: AppointmentFilters;
  stats: AppointmentStats;
  selectedAppointment: AppointmentWithDetails | null;
}

// ==================== Utility Types ====================

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  address?: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  specialization?: string;
  phone?: string;
  email?: string;
}

export interface StatusBadgeConfig {
  label: string;
  className: string;
  icon?: string;
}

export interface PriorityBadgeConfig {
  label: string;
  className: string;
  icon?: string;
}

// ==================== Type Guards ====================

export function isValidAppointmentStatus(status: string): status is AppointmentStatus {
  return ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'].includes(status);
}

export function isValidAppointmentPriority(priority: string): priority is AppointmentPriority {
  return ['normal', 'urgent', 'follow_up'].includes(priority);
}

export function isValidViewMode(mode: string): mode is ViewMode {
  return ['day', 'week', 'month', 'list'].includes(mode);
}

// ==================== Constants ====================

export const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: 'scheduled', label: 'محجوز' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'in_progress', label: 'جاري' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'no_show', label: 'لم يحضر' }
];

export const APPOINTMENT_PRIORITIES: { value: AppointmentPriority; label: string }[] = [
  { value: 'normal', label: 'عادي' },
  { value: 'urgent', label: 'عاجل' },
  { value: 'follow_up', label: 'متابعة' }
];

export const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'day', label: 'يومي' },
  { value: 'week', label: 'أسبوعي' },
  { value: 'month', label: 'شهري' },
  { value: 'list', label: 'قائمة' }
];

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'blue',
  confirmed: 'green',
  in_progress: 'yellow',
  completed: 'gray',
  cancelled: 'red',
  no_show: 'orange'
};

export const PRIORITY_COLORS: Record<AppointmentPriority, string> = {
  normal: 'gray',
  urgent: 'red',
  follow_up: 'blue'
};

// ==================== Default Values ====================

export const DEFAULT_APPOINTMENT_FILTERS: AppointmentFilters = {
  status: 'all',
  priority: 'all',
  searchTerm: ''
};

export const DEFAULT_APPOINTMENT_STATS: AppointmentStats = {
  total: 0,
  scheduled: 0,
  confirmed: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0,
  no_show: 0,
  todayAppointments: 0,
  upcomingAppointments: 0
};

export const DEFAULT_TIME_SLOT_CONFIG = {
  startHour: 8,
  endHour: 20,
  interval: 30 // minutes
};