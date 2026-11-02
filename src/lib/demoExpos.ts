/* ------------------------------------------------------------------ */
/* Demo fishing expos & trade shows — shown on /events and            */
/* /events/<id> until expos are managed from the admin Events tab.    */
/* ------------------------------------------------------------------ */

export type ExpoType = 'Expo' | 'Boat Show' | 'Trade Show' | 'Festival';

export interface Expo {
  id: string;
  name: string;
  type: ExpoType;
  featured?: boolean;
  organizer: string;
  website?: string;
  venue: string;
  address: string;
  city: string;
  state: string; // 2-letter code
  start: string; // YYYY-MM-DD
  end: string;
  /** One row per show day */
  schedule: { date: string; open: string; close: string }[];
  pricing: { label: string; price: number }[];
  image: string;
  about: string;
  highlights: string[];
  exhibitors?: number;
}

const img = (id: string) => `https://images.unsplash.com/${id}?w=1600&q=70&auto=format&fit=crop`;

export const EXPOS: Expo[] = [
  {
    id: 'southern-fishing-boat-expo',
    name: 'Southern Fishing & Boat Expo',
    type: 'Expo',
    featured: true,
    organizer: 'Southern Outdoor Shows',
    venue: 'Georgia World Congress Center',
    address: '285 Andrew Young International Blvd NW',
    city: 'Atlanta', state: 'GA',
    start: '2027-01-22', end: '2027-01-24',
    schedule: [
      { date: '2027-01-22', open: '12:00 PM', close: '8:00 PM' },
      { date: '2027-01-23', open: '10:00 AM', close: '8:00 PM' },
      { date: '2027-01-24', open: '10:00 AM', close: '5:00 PM' },
    ],
    pricing: [
      { label: 'Day Pass (Adult)', price: 14 },
      { label: 'Day Pass (Youth 6–15)', price: 5 },
      { label: 'Kids 5 & under', price: 0 },
      { label: 'Weekend Pass (Adult)', price: 25 },
    ],
    image: img('photo-1775314054195-85f31de0c944'),
    about:
      'The Southeast’s biggest fishing show: hundreds of exhibitors, the newest bass boats and electronics, and three stages of seminars from tournament pros and local guides.',
    highlights: [
      '300+ exhibitors and the latest 2027 bass boats',
      'Seminars from touring pros and local guides',
      'Kids’ casting pond and free youth tackle giveaway',
      'Show-only deals on rods, reels and electronics',
    ],
    exhibitors: 300,
  },
  {
    id: 'carolina-boat-fishing-show',
    name: 'Carolina Boat & Fishing Show',
    type: 'Boat Show',
    organizer: 'Carolina Marine Events',
    venue: 'Raleigh Convention Center',
    address: '500 S Salisbury St',
    city: 'Raleigh', state: 'NC',
    start: '2027-01-29', end: '2027-01-31',
    schedule: [
      { date: '2027-01-29', open: '12:00 PM', close: '8:00 PM' },
      { date: '2027-01-30', open: '10:00 AM', close: '8:00 PM' },
      { date: '2027-01-31', open: '11:00 AM', close: '5:00 PM' },
    ],
    pricing: [
      { label: 'Day Pass (Adult)', price: 12 },
      { label: 'Kids 12 & under', price: 0 },
    ],
    image: img('photo-1773000855345-cea436a4b473'),
    about: 'Fishing boats, pontoons and kayaks from the region’s top dealers, with in-water demos and financing on site.',
    highlights: ['150+ boats on display', 'Dealer show pricing', 'Kayak test pool'],
    exhibitors: 120,
  },
  {
    id: 'northwest-fishing-expo',
    name: 'Northwest Fishing & Outdoor Expo',
    type: 'Expo',
    organizer: 'NW Sportsman Events',
    venue: 'Portland Expo Center',
    address: '2060 N Marine Dr',
    city: 'Portland', state: 'OR',
    start: '2027-02-05', end: '2027-02-07',
    schedule: [
      { date: '2027-02-05', open: '11:00 AM', close: '8:00 PM' },
      { date: '2027-02-06', open: '10:00 AM', close: '8:00 PM' },
      { date: '2027-02-07', open: '10:00 AM', close: '5:00 PM' },
    ],
    pricing: [
      { label: 'Day Pass (Adult)', price: 15 },
      { label: 'Youth 6–16', price: 6 },
      { label: 'Kids 5 & under', price: 0 },
    ],
    image: img('photo-1551131618-3f0a5cf594b4'),
    about: 'Salmon, steelhead and trout gear, drift boats and guided-trip booking for the Pacific Northwest season.',
    highlights: ['Drift boat and sled showcase', 'Fly-tying demos', 'Book guided trips at the show'],
    exhibitors: 200,
  },
  {
    id: 'western-bass-fishing-expo',
    name: 'Western Bass Fishing Expo',
    type: 'Trade Show',
    featured: true,
    organizer: 'Western Bass Events',
    venue: 'Las Vegas Convention Center',
    address: '3150 Paradise Rd',
    city: 'Las Vegas', state: 'NV',
    start: '2027-02-12', end: '2027-02-14',
    schedule: [
      { date: '2027-02-12', open: '9:00 AM', close: '6:00 PM' },
      { date: '2027-02-13', open: '9:00 AM', close: '6:00 PM' },
      { date: '2027-02-14', open: '9:00 AM', close: '4:00 PM' },
    ],
    pricing: [
      { label: 'Day Pass (Adult)', price: 15 },
      { label: 'Kids 12 & under', price: 0 },
      { label: 'Weekend Pass (Adult)', price: 25 },
    ],
    image: img('photo-1761082514914-a4f46c69976a'),
    about: 'Manufacturers and retailers launch new bass gear, with a pro stage and tournament-angler meet and greets.',
    highlights: ['New product launches', 'Pro angler meet and greets', 'Industry day for retailers'],
    exhibitors: 250,
  },
  {
    id: 'great-lakes-tackle-show',
    name: 'Great Lakes Tackle & Outdoor Show',
    type: 'Trade Show',
    organizer: 'Great Lakes Outdoor Shows',
    venue: 'Huntington Place',
    address: '1 Washington Blvd',
    city: 'Detroit', state: 'MI',
    start: '2027-02-26', end: '2027-02-28',
    schedule: [
      { date: '2027-02-26', open: '12:00 PM', close: '8:00 PM' },
      { date: '2027-02-27', open: '10:00 AM', close: '8:00 PM' },
      { date: '2027-02-28', open: '10:00 AM', close: '5:00 PM' },
    ],
    pricing: [
      { label: 'Day Pass (Adult)', price: 13 },
      { label: 'Kids 12 & under', price: 0 },
    ],
    image: img('photo-1783464553837-c6829805772d'),
    about: 'Walleye, musky and ice-fishing gear from Great Lakes makers, plus charter captains booking the coming season.',
    highlights: ['Ice-fishing gear hall', 'Charter captain row', 'Lure-making workshops'],
    exhibitors: 180,
  },
  {
    id: 'texas-kayak-fishing-fest',
    name: 'Texas Kayak Fishing Fest',
    type: 'Festival',
    featured: true,
    organizer: 'Gulf Coast Paddle Co.',
    venue: 'NRG Center',
    address: '1 NRG Pkwy',
    city: 'Houston', state: 'TX',
    start: '2027-03-05', end: '2027-03-07',
    schedule: [
      { date: '2027-03-05', open: '3:00 PM', close: '8:00 PM' },
      { date: '2027-03-06', open: '9:00 AM', close: '7:00 PM' },
      { date: '2027-03-07', open: '9:00 AM', close: '4:00 PM' },
    ],
    pricing: [
      { label: 'Day Pass (Adult)', price: 10 },
      { label: 'Kids 12 & under', price: 0 },
    ],
    image: img('photo-1762655035250-7bdc21d2d23e'),
    about: 'Demo the newest fishing kayaks, learn rigging from Gulf Coast guides and enter the weekend catch-and-release challenge.',
    highlights: ['Indoor kayak demo pool', 'Rigging clinics', 'Catch-and-release challenge'],
    exhibitors: 90,
  },
  {
    id: 'eastern-maine-sportsmans-show',
    name: 'Eastern Maine Sportsman’s Show',
    type: 'Expo',
    organizer: 'Eastern Maine Outdoor Events',
    venue: 'University of Maine Fieldhouse',
    address: '5745 Mahaney Dr',
    city: 'Orono', state: 'ME',
    start: '2027-03-19', end: '2027-03-21',
    schedule: [
      { date: '2027-03-19', open: '1:00 PM', close: '8:00 PM' },
      { date: '2027-03-20', open: '9:00 AM', close: '8:00 PM' },
      { date: '2027-03-21', open: '9:00 AM', close: '4:00 PM' },
    ],
    pricing: [
      { label: 'Day Pass (Adult)', price: 10 },
      { label: 'Day Pass (Child)', price: 0 },
      { label: 'Weekend Pass (Adult)', price: 15 },
    ],
    image: img('photo-1778402566957-c21d77a67d0d'),
    about: 'A Maine tradition: registered guides, sporting camps, fly fishing and outdoor gear under one roof.',
    highlights: ['Maine guides and sporting camps', 'Fly fishing pavilion', 'Youth trout pond'],
    exhibitors: 140,
  },
];

export const expoById = (id: string) => EXPOS.find((e) => e.id === id);

/** "Free" or "$12" */
export const money = (n: number) => (n === 0 ? 'Free' : `$${n % 1 ? n.toFixed(2) : n}`);

/** Lowest paid admission, e.g. "From $10" */
export function admissionFrom(e: Expo) {
  const paid = e.pricing.map((p) => p.price).filter((p) => p > 0);
  return paid.length ? `From $${Math.min(...paid)}` : 'Free admission';
}

export const directionsUrl = (e: Expo) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${e.venue}, ${e.address}, ${e.city}, ${e.state}`)}`;
