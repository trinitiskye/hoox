export type UserRole = 'angler' | 'director' | 'admin' | 'sponsor' | 'judge';
export type UserStatus = 'active' | 'pending' | 'inactive' | 'paused' | 'banned';
export type SubmissionStatus = 'pending' | 'approved' | 'denied';
export type TournamentStatus = 'upcoming' | 'active' | 'completed';

export interface ClubAffiliation {
  name: string;
  website: string;
}

export interface Sponsor {
  name: string;
  website: string;
}

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
  displayName?: string;
  clubAffiliations?: ClubAffiliation[];
  sponsors?: Sponsor[];
  // Separate public profile fields
  profileAvatar?: string;
  profileDisplayName?: string;
  profileOrganization?: string;
  profileAddress?: string;
  profileCity?: string;
  profileState?: string;
  profileZip?: string;
  profileCountry?: string;
  profileEmail?: string;
  profilePhone?: string;
  profileWebsite?: string;
  profileClubAffiliations?: ClubAffiliation[];
  profileSponsors?: Sponsor[];
  message?: string;
  bannerImage?: string;
  bannerStartDate?: string;
  bannerEndDate?: string;
  directorEmail?: string;
  country?: string;
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

export interface RBACPermissions {
  canViewUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewTournaments: boolean;
  canCreateTournaments: boolean;
  canEditTournaments: boolean;
  canDeleteTournaments: boolean;
  canViewSubmissions: boolean;
  canApproveSubmissions: boolean;
  canViewAdminDashboard: boolean;
  canManageAds: boolean;
  canManageSettings: boolean;
}

export function getRBACPermissions(role: UserRole): RBACPermissions {
  switch (role) {
    case 'admin':
      return {
        canViewUsers: true, canEditUsers: true, canDeleteUsers: true,
        canViewTournaments: true, canCreateTournaments: true,
        canEditTournaments: true, canDeleteTournaments: true,
        canViewSubmissions: true, canApproveSubmissions: true,
        canViewAdminDashboard: true, canManageAds: true, canManageSettings: true,
      };
    case 'director':
      return {
        canViewUsers: false, canEditUsers: false, canDeleteUsers: false,
        canViewTournaments: true, canCreateTournaments: true,
        canEditTournaments: true, canDeleteTournaments: false,
        canViewSubmissions: true, canApproveSubmissions: true,
        canViewAdminDashboard: false, canManageAds: false, canManageSettings: false,
      };
    case 'judge':
      return {
        canViewUsers: false, canEditUsers: false, canDeleteUsers: false,
        canViewTournaments: true, canCreateTournaments: false,
        canEditTournaments: false, canDeleteTournaments: false,
        canViewSubmissions: true, canApproveSubmissions: true,
        canViewAdminDashboard: false, canManageAds: false, canManageSettings: false,
      };
    default:
      return {
        canViewUsers: false, canEditUsers: false, canDeleteUsers: false,
        canViewTournaments: true, canCreateTournaments: false,
        canEditTournaments: false, canDeleteTournaments: false,
        canViewSubmissions: false, canApproveSubmissions: false,
        canViewAdminDashboard: false, canManageAds: false, canManageSettings: false,
      };
  }
}
