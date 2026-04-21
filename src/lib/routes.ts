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
  'search-results':     '/search',
};

export function toPath(view: string): string {
  return ROUTES[view] ?? `/${view}`;
}
