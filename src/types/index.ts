export type UserRole = 'angler' | 'director' | 'admin' | 'sponsor';
export type UserStatus = 'active' | 'pending' | 'inactive' | 'paused';
export type SubmissionStatus = 'pending' | 'approved' | 'denied';
export type TournamentStatus = 'upcoming' | 'active' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status?: UserStatus;
  organization?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  message?: string;
  bannerImage?: string;
  bannerStartDate?: string;
  bannerEndDate?: string;
  createdAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  location?: string;
  city?: string;
  state?: string;
  species?: string;
  fishTypes?: string[];
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone?: string;
  registrationFee?: string;
  entryFee?: string;
  maxParticipants?: string;
  image?: string;
  createdBy: string;
  createdAt: string;
  status?: TournamentStatus;
  directorFeePercentage?: number;
}

export interface Series {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  tournaments?: string[];
}

export interface Submission {
  id: string;
  tournamentId: string;
  angler: string;
  species: string;
  size: string;
  catchDate: string;
  catchTime: string;
  location?: string;
  image?: string;
  photo?: string;
  submittedAt: string;
  status: SubmissionStatus;
  reviewedAt?: string | null;
}

export interface Registration {
  id: string;
  tournamentId: string;
  angler: string;
  registeredAt: string;
  fee?: number;
  appOwnerCut?: number;
  directorReceives?: number;
}

export interface SearchParams {
  type: 'all' | 'clubs' | 'series' | 'tournaments' | 'directors' | 'anglers';
  query: string;
}

export interface ConfirmAction {
  type: 'pause' | 'unpause' | 'delete' | 'save';
  user: User;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}
