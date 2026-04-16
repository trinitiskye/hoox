import { Tournament, User, Registration, Submission } from '@/types';

export const sampleUsers: User[] = [
  {
    id: "user-1",
    name: "John Smith",
    email: "john.smith@example.com",
    role: "director",
    status: "active",
    organization: "Lake Pleasant Fishing Club",
    createdAt: new Date('2026-01-15').toISOString()
  },
  {
    id: "user-2",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    role: "angler",
    status: "active",
    organization: "N/A",
    createdAt: new Date('2026-02-01').toISOString()
  },
  {
    id: "user-3",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    role: "angler",
    status: "active",
    organization: "N/A",
    createdAt: new Date('2026-02-01').toISOString()
  },
  {
    id: "user-4",
    name: "Tom Davis",
    email: "tom.davis@example.com",
    role: "angler",
    status: "active",
    organization: "N/A",
    createdAt: new Date('2026-02-02').toISOString()
  },
  {
    id: "user-5",
    name: "David Chen",
    email: "david.chen@example.com",
    role: "angler",
    status: "active",
    organization: "N/A",
    createdAt: new Date('2026-02-03').toISOString()
  }
];

export const sampleTournaments: Tournament[] = [
  {
    id: "test-tournament-1",
    name: "Spring Bass Tournament 2026",
    description: "Annual spring bass fishing competition at Lake Pleasant. Open to all skill levels. Catch and release only.",
    location: "Lake Pleasant",
    city: "Phoenix",
    state: "AZ",
    species: "Bass",
    fishTypes: ["Largemouth Bass", "Smallmouth Bass", "Striped Bass"],
    startDate: "2026-02-15",
    startTime: "06:00",
    endDate: "2026-02-15",
    endTime: "18:00",
    timezone: "America/Phoenix",
    registrationFee: "50.00",
    maxParticipants: "50",
    createdBy: "John Smith",
    createdAt: new Date().toISOString(),
    status: "upcoming"
  },
  {
    id: "completed-tournament-1",
    name: "Winter Bass Classic 2026",
    location: "Lake Pleasant",
    city: "Phoenix",
    state: "AZ",
    description: "Annual winter bass fishing championship. Completed tournament.",
    species: "Largemouth Bass",
    fishTypes: ["Largemouth Bass", "Smallmouth Bass"],
    startDate: "2026-01-20",
    startTime: "06:00",
    endDate: "2026-01-20",
    endTime: "18:00",
    timezone: "America/Phoenix",
    registrationFee: "75.00",
    maxParticipants: "30",
    createdBy: "John Smith",
    createdAt: new Date('2026-01-10').toISOString(),
    status: "completed"
  }
];

export const sampleRegistrations: Registration[] = [
  {
    id: "reg-1",
    tournamentId: "test-tournament-1",
    angler: "Mike Johnson",
    registeredAt: new Date('2026-02-01').toISOString(),
    fee: 50.00
  },
  {
    id: "reg-2",
    tournamentId: "test-tournament-1",
    angler: "Sarah Williams",
    registeredAt: new Date('2026-02-01').toISOString(),
    fee: 50.00
  },
  {
    id: "comp-reg-1",
    tournamentId: "completed-tournament-1",
    angler: "Sarah Williams",
    registeredAt: new Date('2026-01-15').toISOString(),
    fee: 75.00
  },
  {
    id: "comp-reg-2",
    tournamentId: "completed-tournament-1",
    angler: "Mike Johnson",
    registeredAt: new Date('2026-01-15').toISOString(),
    fee: 75.00
  }
];

export const sampleSubmissions: Submission[] = [
  {
    id: "comp-sub-1",
    tournamentId: "completed-tournament-1",
    angler: "Sarah Williams",
    species: "Largemouth Bass",
    size: "22.5",
    catchDate: "2026-01-20",
    catchTime: "08:30",
    location: "North Cove",
    photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%2348bb78' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dy='.3em'%3ELargemouth Bass - 22.5%22%3C/text%3E%3C/svg%3E",
    submittedAt: new Date('2026-01-20T08:45:00').toISOString(),
    status: "approved",
    reviewedAt: new Date('2026-01-20T09:00:00').toISOString()
  },
  {
    id: "comp-sub-2",
    tournamentId: "completed-tournament-1",
    angler: "Sarah Williams",
    species: "Largemouth Bass",
    size: "19.8",
    catchDate: "2026-01-20",
    catchTime: "11:15",
    location: "East Shore",
    photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%2348bb78' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dy='.3em'%3ELargemouth Bass - 19.8%22%3C/text%3E%3C/svg%3E",
    submittedAt: new Date('2026-01-20T11:30:00').toISOString(),
    status: "approved",
    reviewedAt: new Date('2026-01-20T11:45:00').toISOString()
  },
  {
    id: "comp-sub-3",
    tournamentId: "completed-tournament-1",
    angler: "Sarah Williams",
    species: "Largemouth Bass",
    size: "18.2",
    catchDate: "2026-01-20",
    catchTime: "14:30",
    location: "South Point",
    photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%2348bb78' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dy='.3em'%3ELargemouth Bass - 18.2%22%3C/text%3E%3C/svg%3E",
    submittedAt: new Date('2026-01-20T14:45:00').toISOString(),
    status: "approved",
    reviewedAt: new Date('2026-01-20T15:00:00').toISOString()
  },
  {
    id: "comp-sub-4",
    tournamentId: "completed-tournament-1",
    angler: "Mike Johnson",
    species: "Largemouth Bass",
    size: "20.1",
    catchDate: "2026-01-20",
    catchTime: "09:20",
    location: "West Bay",
    photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%234299e1' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dy='.3em'%3ELargemouth Bass - 20.1%22%3C/text%3E%3C/svg%3E",
    submittedAt: new Date('2026-01-20T09:35:00').toISOString(),
    status: "approved",
    reviewedAt: new Date('2026-01-20T09:50:00').toISOString()
  }
];
