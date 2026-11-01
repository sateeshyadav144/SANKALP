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
  subject_name?: string;
  code?: string;
  subject_code?: string;
  instructor?: string;
  target_attendance_percentage?: number;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  subject_id: string;
  date: string; // YYYY-MM-DD
  attendance_date?: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'present' | 'absent' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
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

export type DiagramType = 
  | 'flowchart' 
  | 'mindmap' 
  | 'block' 
  | 'concept' 
  | 'sequence' 
  | 'usecase' 
  | 'classDiagram' 
  | 'erDiagram' 
  | 'dfd' 
  | 'architecture' 
  | 'stateDiagram' 
  | 'gantt';

export interface SourceDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  page_count: number;
  storage_path?: string;
  processing_status: 'processing' | 'completed' | 'error';
  created_at?: string;
  updated_at?: string;
}

export interface ExtractedTopic {
  id: string;
  document_id: string;
  user_id: string;
  parent_topic_id?: string | null;
  topic_number: string;
  topic_title: string;
  subtopics: string[];
  extracted_content: string;
  page_references: number[];
  suggested_diagram_types?: DiagramType[];
  display_order: number;
  created_at?: string;
}

export interface PdfExtractionResult {
  fileName: string;
  fileSize: number;
  pageCount: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    charCount: number;
  }>;
  fullText: string;
  isEncrypted: boolean;
  hasContent: boolean;
  error?: string;
}

export interface Diagram {
  id: string;
  user_id: string;
  document_id?: string;
  topic_id?: string;
  title: string;
  subject: string;
  topic?: string;
  diagram_type: DiagramType;
  mermaid_code: string;
  description?: string;
  page_references?: string | number[];
  created_at?: string;
  updated_at?: string;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  subject?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Flashcard {
  id: string;
  deck_id?: string;
  user_id: string;
  subject: string;
  topic?: string;
  question: string;
  answer: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  times_reviewed: number;
  times_correct: number;
  last_reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FlashcardReview {
  id: string;
  user_id: string;
  card_id: string;
  flashcard_id?: string;
  status: 'known' | 'revision';
  rating?: 'easy' | 'good' | 'hard';
  reviewed_at: string;
}

export interface DeckWithStats extends FlashcardDeck {
  totalCards: number;
  knownCards: number;
  revisionCards: number;
  notReviewedCards: number;
  completionRate: number;
  lastReviewedDate?: string;
}

export interface CodeSnippet {
  id: string;
  user_id: string;
  title: string;
  language: 'javascript' | 'typescript' | 'python' | 'html' | 'css' | 'c' | 'cpp';
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

export type VoiceInstallationStatus =
  | 'installed_local'
  | 'available_cloud'
  | 'not_installed'
  | 'unsupported_by_provider';

export interface IndianLanguageOption {
  code: string;
  iso639: string;
  name: string;
  nativeName: string;
  script: string;
  sampleGreeting: string;
  windowsPackName?: string;
  windowsSpeechPackAvailable: boolean;
  cloudTtsSupported: boolean;
  alternativeLang?: string;
}

export interface VoiceMeta {
  voiceURI: string;
  name: string;
  lang: string;
  gender: 'male' | 'female' | 'unspecified';
  isLocal: boolean;
  provider?: 'local' | 'cloud';
}

export interface SavedSpeechNote {
  id: string;
  user_id: string;
  title: string;
  text: string;
  language_code: string;
  language_name: string;
  voice_name: string;
  voice_gender: 'male' | 'female' | 'unspecified';
  created_at: string;
}

// ============================================================================
// STUDENT SAFETY & WELFARE TYPES
// ============================================================================
export type SafetyIssueCategory =
  | 'Ragging'
  | 'Bullying'
  | 'Harassment Concern'
  | 'Campus Safety'
  | 'Infrastructure Problem'
  | 'Hostel or Classroom Issue'
  | 'Other';

export type SafetyReportStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Action Taken'
  | 'Resolved';

export interface SafetyReport {
  id: string;
  report_code: string;
  user_id?: string | null;
  is_anonymous: boolean;
  category: SafetyIssueCategory;
  subject: string;
  description: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  status: SafetyReportStatus;
  staff_notes?: string | null;
  action_summary?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface EmergencyHelpline {
  id: string;
  service: string;
  helpline: string;
  description: string;
  isPrimary?: boolean;
}

export interface VerifiedSupportContact {
  id: string;
  role: 'administration' | 'security' | 'medical' | 'counselor';
  title: string;
  department: string;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  hours?: string | null;
  is_available: boolean;
}

