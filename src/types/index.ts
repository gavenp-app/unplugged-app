import { User as FirebaseAuthUser } from 'firebase/auth';

// Custom User Interface extending Firebase Auth User
export interface AppUser extends FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  // Add any other user-specific fields here
}

export interface Child {
  id: string;
  parentId: string; // The UID of the parent user
  name: string;
  age?: number;
  avatar?: string; // URL to child's avatar
  createdAt: Date;
}

export interface Activity {
  id: string;
  parentId: string; // The UID of the parent who created it (for custom activities)
  name: string;
  description?: string;
  category: string; // e.g., "Movement", "Crafts", "Learning"
  minAge?: number;
  maxAge?: number;
  duration?: number; // Estimated duration in minutes
  isCustom: boolean; // True if created by a parent, false for curated
  imageUrl?: string; // URL for an image related to the activity
  createdAt: Date;
}

export interface Timer {
  id: string;
  parentId: string;
  childId: string;
  initialDuration: number; // Duration in minutes
  remainingTime: number; // Current remaining time in seconds
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startTime: Date;
  endTime?: Date; // When the timer is expected to end
  activitySuggestionId?: string; // ID of the suggested activity when timer ends
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  parentId: string;
  childId: string;
  activityId: string; // ID of the performed activity
  timerId?: string; // Optional: ID of the timer that triggered the activity
  timestamp: Date;
  notes?: string;
  // Could add a rating, photo, etc.
}
