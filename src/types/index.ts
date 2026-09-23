export type UserRole = 'OB' | 'SPV';

export type ShiftType = 'Pagi' | 'Siang' | 'Sore' | 'Malam';

export type ItemStatus = 'done' | 'issue' | 'na';

export type InspectionStatus = 'pending_review' | 'approved' | 'needs_revision';

export interface ChecklistItem {
  id: string;
  name: string;
  category?: string;
  status: ItemStatus;
  note?: string;
  photoUrl?: string; // Base64 data URI or image URL
}

export interface AreaReport {
  areaId: string;
  areaName: string;
  locationFloor?: string;
  isCompleted: boolean;
  items: ChecklistItem[];
  notes?: string;
  photos: string[]; // array of base64 photos
  completedAt?: string;
}

export interface DailyChecklistReport {
  id: string; // Firestore document ID
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  shift: ShiftType;
  obName: string;
  obId?: string;
  obNotes?: string;
  obSignature?: string; // Base64 signature
  submittedAt: string;

  areas: AreaReport[];

  // SPV Verification fields
  inspectionStatus: InspectionStatus;
  spvName?: string;
  spvId?: string;
  spvRating?: number; // 1 to 5
  spvNotes?: string;
  spvSignature?: string; // Base64 signature
  reviewedAt?: string;
  revisionRequiredItems?: string[];

  // Offline / sync metadata
  isLocalOnly?: boolean;
}

export interface AreaMaster {
  id: string;
  name: string;
  floor: string;
  iconName: string;
  defaultTasks: string[];
}

export interface StaffMaster {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // 4-digit PIN for simple fast mobile login
  phone?: string;
  active: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}
