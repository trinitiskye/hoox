import { Tournament, Submission, User } from '@/types';

export const getTimezoneAbbr = (timezone?: string): string => {
  const timezoneMap: Record<string, string> = {
    'America/New_York': 'ET',
    'America/Chicago': 'CT',
    'America/Denver': 'MT',
    'America/Phoenix': 'MST',
    'America/Los_Angeles': 'PT',
    'America/Anchorage': 'AKT',
    'Pacific/Honolulu': 'HST',
    'America/Puerto_Rico': 'AT'
  };
  return timezone ? timezoneMap[timezone] || 'TZ' : 'TZ';
};

export const isTournamentActive = (tournament: Tournament): boolean => {
  const now = new Date();
  const start = new Date(tournament.startDate + 'T' + tournament.startTime);
  const end = new Date(tournament.endDate + 'T' + tournament.endTime);
  return now >= start && now <= end;
};

export const calculateLeaderboard = (tournamentId: string, submissions: Submission[]) => {
  const approvedSubmissions = submissions.filter(
    sub => sub.tournamentId === tournamentId && sub.status === 'approved'
  );

  const anglerTotals: Record<string, { angler: string; totalInches: number; catches: number }> = {};
  
  approvedSubmissions.forEach(sub => {
    if (!anglerTotals[sub.angler]) {
      anglerTotals[sub.angler] = { angler: sub.angler, totalInches: 0, catches: 0 };
    }
    anglerTotals[sub.angler].totalInches += parseFloat(sub.size);
    anglerTotals[sub.angler].catches += 1;
  });

  return Object.values(anglerTotals).sort((a, b) => b.totalInches - a.totalInches);
};

export const isUserRegistered = (
  tournamentId: string,
  currentUser: User | null,
  registrations: any[]
): boolean => {
  if (!currentUser) return false;
  const userName = currentUser.name || currentUser.email;
  return registrations.some(reg => reg.tournamentId === tournamentId && reg.angler === userName);
};

export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
