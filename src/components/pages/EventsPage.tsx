'use client';

const DEMO_EVENTS = [
  {
    id: '1',
    name: "Eastern Maine Sportsman's Show",
    venue: 'University of Maine Fieldhouse',
    city: 'Orono', state: 'ME',
    image: 'https://images.unsplash.com/photo-1587502537745-84b86da1204f?w=400&h=200&fit=crop',
    schedule: [
      { date: '03/20/2026', hours: '1:00 PM to 8:00 PM' },
      { date: '03/21/2026', hours: '9:00 AM to 8:00 PM' },
      { date: '03/22/2026', hours: '9:00 AM to 4:00 PM' },
    ],
    pricing: [
      { label: 'Day Pass (Adult)', price: '$10.00' },
      { label: 'Day Pass (Child)', price: '$0.00' },
      { label: 'Weekend Pass (Adult)', price: '$15.00' },
    ],
  },
  {
    id: '2',
    name: 'Southern Fishing Expo',
    venue: 'Georgia World Congress Center',
    city: 'Atlanta', state: 'GA',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=200&fit=crop',
    schedule: [
      { date: '04/10/2026', hours: '10:00 AM to 7:00 PM' },
      { date: '04/11/2026', hours: '10:00 AM to 7:00 PM' },
      { date: '04/12/2026', hours: '10:00 AM to 5:00 PM' },
    ],
    pricing: [
      { label: 'Day Pass (Adult)', price: '$12.00' },
      { label: 'Day Pass (Child)', price: '$5.00' },
      { label: 'Weekend Pass (Adult)', price: '$20.00' },
    ],
  },
  {
    id: '3',
    name: 'Western Bass Fishing Expo',
    venue: 'Las Vegas Convention Center',
    city: 'Las Vegas', state: 'NV',
    image: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=400&h=200&fit=crop',
    schedule: [
      { date: '05/08/2026', hours: '9:00 AM to 6:00 PM' },
      { date: '05/09/2026', hours: '9:00 AM to 6:00 PM' },
      { date: '05/10/2026', hours: '9:00 AM to 4:00 PM' },
    ],
    pricing: [
      { label: 'Day Pass (Adult)', price: '$15.00' },
      { label: 'Day Pass (Child)', price: '$0.00' },
      { label: 'Weekend Pass (Adult)', price: '$25.00' },
    ],
  },
];

interface EventsPageProps {
  onNavigate: (view: string) => void;
}

export default function EventsPage({ onNavigate }: EventsPageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div className="relative w-full h-64 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587502537745-84b86da1204f?w=1200')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gray-900/60" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-4xl font-bold text-white mb-2">Fishing Expos & Trade Shows</h1>
          <p className="text-gray-200 text-lg">Discover the latest gear, techniques, and innovations</p>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {[0,1,2].map(i => <button key={i} className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`} />)}
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_EVENTS.map(event => (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
              <div className="h-40 overflow-hidden">
                <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{event.name}</h3>
                <p className="text-gray-500 text-sm mb-1">{event.venue}</p>
                <p className="text-gray-400 text-sm mb-4">{event.city}, {event.state}</p>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Event Schedule</p>
                  <div className="space-y-1">
                    {event.schedule.map(s => (
                      <p key={s.date} className="text-sm text-gray-600">{s.date} {s.hours}</p>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  {event.pricing.map(p => (
                    <div key={p.label} className="flex justify-between text-sm py-0.5">
                      <span className="text-gray-600">{p.label}</span>
                      <span className="text-gray-800 font-medium">{p.price}</span>
                    </div>
                  ))}
                </div>

                <button className="text-blue-600 hover:underline text-sm font-medium">
                  View more info
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
