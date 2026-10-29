// ==============================================================================
// SANKALP — TypeScript Domain Interfaces & Types
// ==============================================================================

export interface StudentProfile {
  id: string;
  full_name: string;
  roll_number?: string;
  department?: string;
  semester?: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string; // YYYY-MM
  monthly_limit: number;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: 'Food & Canteen' | 'Books & Stationery' | 'Travel & Transit' | 'Hostel & Rent' | 'Utilities' | 'Entertainment' | 'Others';
  date: string; // YYYY-MM-DD
  payment_method: 'UPI' | 'Cash' | 'Card' | 'Net Banking';
  notes?: string;
  created_at?: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  instructor?: string;
  target_attendance_percentage: number;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  subject_id: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'cancelled';
  notes?: string;
  created_at?: string;
}

export interface SubjectAttendanceStat {
  subject: Subject;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  cancelledClasses: number;
  percentage: number;
  isBelowTarget: boolean;
  statusClass: 'danger' | 'warning' | 'good';
  classesNeededForTarget: number; // how many consecutive present classes needed to reach target percentage
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  content: string;
  summary?: string;
  key_points: string[];
  action_items?: string[];
  tags: string[];
  is_ai_generated?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DiagramType = 'flowchart' | 'sequence' | 'classDiagram' | 'stateDiagram' | 'mindmap' | 'gantt';

export interface Diagram {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  topic?: string;
  diagram_type: DiagramType;
  mermaid_code: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  subject: string;
  topic?: string;
  question: string;
  answer: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  times_reviewed: number;
  times_correct: number;
  last_reviewed_at?: string;
  created_at?: string;
}

export interface FlashcardReview {
  id: string;
  user_id: string;
  card_id: string;
  rating: 'easy' | 'good' | 'hard';
  reviewed_at: string;
}

export interface CodeSnippet {
  id: string;
  user_id: string;
  title: string;
  language: 'javascript' | 'typescript' | 'python' | 'html' | 'c' | 'cpp';
  code: string;
  description?: string;
  output?: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

export interface SafetyResource {
  id: string;
  user_id?: string | null;
  is_institutional: boolean;
  category: 'emergency' | 'security' | 'medical' | 'helpline' | 'mental_health' | 'personal';
  title: string;
  description?: string;
  phone: string;
  email?: string;
  location?: string;
  hours: string;
  is_verified: boolean;
  created_at?: string;
}

export interface CampusNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  moduleLink?: string;
}

export interface OverallDashboardStats {
  monthlyExpenditure: number;
  monthlyBudget: number;
  budgetUtilizationPct: number;
  overallAttendancePct: number;
  totalSubjects: number;
  totalNotes: number;
  totalFlashcards: number;
  totalSnippets: number;
  totalDiagrams: number;
  lowAttendanceCount: number;
}
