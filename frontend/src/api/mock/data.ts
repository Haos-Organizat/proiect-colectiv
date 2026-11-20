import type { OrganizerEvent, User } from '@/types/api';

/*
 * Seed data for mock mode (VITE_USE_MOCKS=true). Dates are relative to "now" so the
 * mock events always look upcoming. Photos live in public/mock/events/.
 */

const DAY = 86_400_000;

function at(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date(Date.now() + daysFromNow * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const ron = (lei: number) => ({ amount: lei * 100, currency: 'RON' as const });

export const MOCK_PASSWORD = 'student123';

export const seedUsers: User[] = [
  {
    id: 'u_student',
    name: 'Ples Denisa',
    email: 'student@uniconnect.test',
    role: 'student',
    university: 'Babes-Bolyai University',
  },
  {
    id: 'u_org',
    name: 'Student Union UBB',
    email: 'organizer@uniconnect.test',
    role: 'organizer',
    university: 'Babes-Bolyai University',
  },
];

interface Seed {
  slug: string;
  title: string;
  category: OrganizerEvent['category'];
  days: number;
  start: [number, number];
  hours: number;
  venue: string;
  price: number;
  capacity: number;
  sold: number;
  image: string;
  description: string;
}

const seeds: Seed[] = [
  {
    slug: 'campus-sound-night',
    title: 'Concert Rock Live',
    category: 'concert',
    days: 4,
    start: [20, 0],
    hours: 4,
    venue: 'Central Park Stage',
    price: 45,
    capacity: 800,
    sold: 612,
    image: 'concert',
    description:
      'Four student bands, one open-air stage and the whole campus in front of it. Doors open at 19:30, first band at 20:00. Bring a jacket, the park gets cold after dark.',
  },
  {
    slug: 'hack-the-campus-24h',
    title: 'Hack the Campus 24h',
    category: 'tech',
    days: 9,
    start: [10, 0],
    hours: 24,
    venue: 'FSEGA Hall',
    price: 0,
    capacity: 240,
    sold: 198,
    image: 'hackathon',
    description:
      'Twenty-four hours to build something useful for students. Teams of up to four, mentors from local tech companies, food all night and prizes for the top three projects.',
  },
  {
    slug: 'autumn-careers-fair',
    title: 'Autumn Careers Fair',
    category: 'career',
    days: 12,
    start: [10, 0],
    hours: 7,
    venue: 'Main Atrium',
    price: 0,
    capacity: 1500,
    sold: 640,
    image: 'career-fair',
    description:
      'Forty companies hiring interns and juniors across IT, finance, engineering and design. Bring printed CVs, the CV review corner is open all day.',
  },
  {
    slug: 'open-air-film-night',
    title: 'Open Air Film Night',
    category: 'culture',
    days: 6,
    start: [19, 30],
    hours: 3,
    venue: 'Hasdeu Campus Lawn',
    price: 15,
    capacity: 300,
    sold: 300,
    image: 'film-night',
    description:
      'A cult classic on a big screen under the sky. Blankets and bean bags provided, popcorn included with every ticket.',
  },
  {
    slug: 'freshers-warehouse-party',
    title: "Freshers' Warehouse Party",
    category: 'party',
    days: 2,
    start: [22, 0],
    hours: 6,
    venue: 'Form Space',
    price: 35,
    capacity: 900,
    sold: 845,
    image: 'party',
    description:
      'The first big party of the year. Two rooms, four DJs, and the whole first year in one place. Student ID required at the door.',
  },
  {
    slug: 'five-a-side-cup',
    title: 'Five-a-Side Cup',
    category: 'sport',
    days: 15,
    start: [17, 0],
    hours: 5,
    venue: 'Campus Sports Base',
    price: 20,
    capacity: 160,
    sold: 96,
    image: 'football',
    description:
      'Faculty against faculty under the floodlights. Register as a player or come cheer. The ticket covers entry for spectators and players alike.',
  },
  {
    slug: 'black-box-theatre-premiere',
    title: 'Black Box: Student Premiere',
    category: 'culture',
    days: 18,
    start: [19, 0],
    hours: 2,
    venue: 'Student Culture House',
    price: 25,
    capacity: 120,
    sold: 71,
    image: 'theatre',
    description:
      'The drama club premieres its new play: ninety minutes, two actors, one spotlight. Seats are not numbered, arrive early for the front rows.',
  },
  {
    slug: 'design-sprint-workshop',
    title: 'Design Sprint Workshop',
    category: 'workshop',
    days: 7,
    start: [14, 0],
    hours: 4,
    venue: 'Arts Studio 2',
    price: 10,
    capacity: 40,
    sold: 33,
    image: 'workshop',
    description:
      'A hands-on afternoon on running a design sprint, from problem to tested prototype. Paper and markers provided, no design experience needed.',
  },
  {
    slug: 'ai-and-you-guest-lecture',
    title: 'AI and You: Guest Lecture',
    category: 'tech',
    days: 21,
    start: [18, 0],
    hours: 2,
    venue: 'Aula Magna',
    price: 0,
    capacity: 450,
    sold: 302,
    image: 'talk',
    description:
      'A practical talk on how AI is changing the first job you will get, followed by an open Q&A. Free entry, but you still need a ticket.',
  },
  {
    slug: 'plant-a-tree-morning',
    title: 'Plant a Tree Morning',
    category: 'volunteering',
    days: 10,
    start: [9, 0],
    hours: 4,
    venue: 'Rozelor Park',
    price: 0,
    capacity: 120,
    sold: 64,
    image: 'volunteering',
    description:
      'Join two hundred saplings and a few dozen volunteers. Gloves and tools provided, warm tea after. Wear shoes you do not mind getting muddy.',
  },
];

export const seedEvents: OrganizerEvent[] = seeds.map((s, i) => {
  const startsAt = at(s.days, s.start[0], s.start[1]);
  const endsAt = new Date(new Date(startsAt).getTime() + s.hours * 3_600_000).toISOString();
  return {
    id: `e_${i + 1}`,
    slug: s.slug,
    title: s.title,
    category: s.category,
    startsAt,
    endsAt,
    venue: s.venue,
    city: 'Cluj-Napoca',
    imageUrl: `/mock/events/${s.image}.webp`,
    price: ron(s.price),
    capacity: s.capacity,
    ticketsLeft: s.capacity - s.sold,
    ticketsSold: s.sold,
    revenue: ron(s.price * s.sold),
    maxPerOrder: s.category === 'party' ? 4 : 6,
    description: s.description,
    organizer: { id: 'u_org', name: 'Student Union UBB' },
    status: 'published',
  };
});
