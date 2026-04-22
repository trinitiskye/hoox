// Maps old SPA view names to real Next.js URLs
export const ROUTES: Record<string, string> = {
  'home':               '/',
  'login':              '/login',
  'admin-login':        '/admin-login',
  'forgot-password':    '/forgot-password',
  'register':           '/register',
  'register-angler':    '/register/angler',
  'register-director':  '/register/director',
  'register-judge':     '/register/judge',
  'judges':             '/register/judge',
  'sponsor':            '/partner',
  'series':             '/series',
  'tournaments':        '/tournaments',
  'clubs':              '/clubs',
  'events':             '/events',
  'features':           '/features',
  'admin-dashboard':    '/admin',
  'admin':              '/admin',
  '/admin':             '/admin',
  '/admin/users':       '/admin/users',
  '/admin/partners':    '/admin/partners',
  '/admin/clubs':       '/admin/clubs',
  '/admin/series':      '/admin/series',
  '/admin/tournaments': '/admin/tournaments',
  '/admin/events':      '/admin/events',
  '/admin/catch-submissions': '/admin/catch-submissions',
  '/admin/advertising': '/admin/advertising',
  '/admin/monetization':'/admin/monetization',
  '/admin/cms':         '/admin/cms',
  '/admin/settings':    '/admin/settings',
  'search-results':     '/search',
};

export function toPath(view: string): string {
  return ROUTES[view] ?? `/${view}`;
}
