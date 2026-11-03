// FAQ content for /faq. Answers are plain text with simple links written as
// [label](/path). Edit questions here; the page, search and Google's FAQ
// rich-result data all read from this list.

export interface FaqItem { id: string; q: string; a: string[] }
export interface FaqSection { id: string; title: string; blurb: string; items: FaqItem[] }

export const FAQ: FaqSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    blurb: 'What HOOX is and how to join.',
    items: [
      {
        id: 'what-is-hoox',
        q: 'What is HOOX?',
        a: [
          'HOOX is a fishing tournament platform. Anglers find and register for tournaments, submit catches from the water and follow live leaderboards. Tournament directors use it to run their events, from registration to final results.',
          'You’ll also find fishing clubs, expos and trade shows, and a calendar of what’s coming up near you.',
        ],
      },
      {
        id: 'tournament-series-club',
        q: 'What’s the difference between a tournament, a series and a club?',
        a: [
          'A tournament is a single event you register for. A series is a group of tournaments under one name, like a season-long trail with several stops. A club is a group of anglers who share a type of fishing, such as a bass or trout club. Some clubs charge membership dues. Clubs aren’t tournaments or series, but many clubs fish them together.',
        ],
      },
      {
        id: 'account-types',
        q: 'Which kind of account should I create?',
        a: [
          'Choose an [Angler account](/register/angler) if you fish in tournaments. Choose a [Tournament Director account](/register/director) if you organize them. Judges sign up with a [Judge account](/register/judge) and are connected to their director. Brands and businesses can [become a partner](/partner).',
          'Not sure? Start at [Register](/register) to compare them.',
        ],
      },
      {
        id: 'cost',
        q: 'Does it cost anything to join?',
        a: [
          'Creating an Angler or Tournament Director account is free. Each tournament’s director sets its entry fee, which you pay when you register. Optional promotions, like featuring a club or advertising, are paid.',
        ],
      },
      {
        id: 'google-sign-in',
        q: 'Can I sign in with Google?',
        a: [
          'Yes. Use “Sign in with Google” on the [login page](/login) or when you create an Angler or Director account. If you forget your email password, use [Forgot password](/forgot-password).',
        ],
      },
    ],
  },
  {
    id: 'anglers',
    title: 'For anglers',
    blurb: 'Finding events, registering and following the action.',
    items: [
      {
        id: 'find-tournaments',
        q: 'How do I find tournaments near me?',
        a: [
          'Browse [Tournaments](/tournaments) or use [Search](/search?type=tournaments) to filter by state, species, status and dates. Search can also look near a ZIP code or your current location. The [Tournament Calendar](/calendar) shows every tournament and series event by day.',
        ],
      },
      {
        id: 'register',
        q: 'How do I register for a tournament?',
        a: [
          'Open the tournament, choose to register solo or as a team, and pay the entry fee in the same step.',
        ],
      },
      {
        id: 'leaderboard',
        q: 'How do live leaderboards work?',
        a: [
          'As soon as a judge approves a catch, the standings update for everyone, on the web and in the app. You can follow any event on [Leaderboards](/leaderboards).',
        ],
      },
      {
        id: 'profile',
        q: 'What’s on my angler profile?',
        a: [
          'Your public profile collects your results, wins and tournament history in one place. You can also list your club affiliations and sponsors.',
        ],
      },
      {
        id: 'winners-circle',
        q: 'What is the Winners Circle?',
        a: [
          'The Winners Circle on the [home page](/) features first-place catches from recent events.',
        ],
      },
      {
        id: 'app',
        q: 'Is there a HOOX mobile app?',
        a: [
          'The HOOX app is coming to the App Store and Google Play. It lets you submit catches from the water, get alerts when your catch is approved or you move up the board, and keep working with weak signal. See [Download the app](/download) for details.',
        ],
      },
    ],
  },
  {
    id: 'catches',
    title: 'Catch submissions & judging',
    blurb: 'How catches are photographed, verified and ranked.',
    items: [
      {
        id: 'how-submit',
        q: 'How do I submit a catch?',
        a: [
          'Photograph your fish on the measuring board and submit the photo from your phone during the tournament. Judges review it, and once it’s approved it counts on the leaderboard.',
        ],
      },
      {
        id: 'photo-rules',
        q: 'What makes a catch photo valid?',
        a: [
          'Lay the fish on the measuring board with its mouth against the stop. Hold it down with your hand so the back of your hand, with that tournament’s code written on it, is clearly in the photo.',
          'The code ties the photo to this tournament and today’s fishing, so judges can verify it.',
        ],
      },
      {
        id: 'tournament-code',
        q: 'What is the tournament code, and when do I get it?',
        a: [
          'The director releases a unique code right before the tournament starts. Write it on the back of your hand in black marker before you begin fishing. Codes are not shared in advance, so a photo with the code was taken during the event.',
        ],
      },
      {
        id: 'who-verifies',
        q: 'Who reviews my catches?',
        a: [
          'Judges assigned by the tournament director check the code on your hand and the measurement before approving each catch. Approved catches update the leaderboard right away.',
        ],
      },
      {
        id: 'no-signal',
        q: 'What if I don’t have cell service on the water?',
        a: [
          'In the HOOX app, catches you submit without service are saved on your phone and sent as soon as you’re back in range.',
        ],
      },
      {
        id: 'questions-rejected',
        q: 'What if my catch isn’t approved?',
        a: [
          'Contact the tournament director. They set the event rules and make the final call on submissions.',
        ],
      },
    ],
  },
  {
    id: 'directors',
    title: 'For tournament directors',
    blurb: 'Running events, judges and results.',
    items: [
      {
        id: 'create-tournament',
        q: 'How do I run a tournament on HOOX?',
        a: [
          'Create a free [Tournament Director account](/register/director). You can set up single tournaments or multi-stop series with your own rules, dates, species and locations. Anglers and teams then register and pay entry fees online.',
        ],
      },
      {
        id: 'judges',
        q: 'How do I add judges?',
        a: [
          'Judges create a [Judge account](/register/judge) and enter their director’s email. If you already have a director account, the judge waits for your approval before they can review catches.',
        ],
      },
      {
        id: 'results',
        q: 'How are results and payouts handled?',
        a: [
          'When the event ends, final standings, big-fish winners and payouts are calculated and published for everyone to see.',
        ],
      },
      {
        id: 'list-tournament',
        q: 'Can I promote my tournament?',
        a: [
          'Yes. Tournaments appear on the Tournaments page, Search and the Tournament Calendar, and can be featured on the home page and other pages. [Contact us](/contact) to ask about featured placement.',
        ],
      },
    ],
  },
  {
    id: 'clubs',
    title: 'Fishing clubs',
    blurb: 'Finding, listing and featuring clubs.',
    items: [
      {
        id: 'find-club',
        q: 'How do I find a fishing club?',
        a: [
          'Browse the [Clubs directory](/clubs) by location, fishing style and skill level, or switch to the [club map](/clubs?view=map) to see clubs near you.',
        ],
      },
      {
        id: 'submit-club',
        q: 'How do I list my club?',
        a: [
          'Use [Submit a Club](/clubs/submit). You need an Angler or Tournament Director account. If you don’t have one, you can create it on that page as you submit. We review every listing before it goes live, and listing a club is free.',
        ],
      },
      {
        id: 'feature-club',
        q: 'How do I feature my club?',
        a: [
          'Featured clubs get a Featured badge, the top spot in the directory and search, a turn in the Clubs page banner and a spot on the home page. See plans and request it on [Feature your Club](/clubs/feature). Nothing is charged online; we confirm your dates and email an invoice.',
        ],
      },
    ],
  },
  {
    id: 'events',
    title: 'Expos & events',
    blurb: 'Fishing shows, boat shows and festivals.',
    items: [
      {
        id: 'find-events',
        q: 'Where can I find fishing expos and boat shows?',
        a: [
          'See [Expos and Trade Shows](/events) for upcoming shows, or the [Event Calendar](/events/calendar) to see them by month. Each show has dates, hours, admission prices and directions.',
        ],
      },
      {
        id: 'submit-event',
        q: 'How do I get my show listed?',
        a: [
          'Send it through [Submit your Event](/events/submit). Basic listings are free. You can also request featured placement, like the home page hero or banner ads. We review every request and reply by email with options and pricing.',
        ],
      },
    ],
  },
  {
    id: 'advertising',
    title: 'Advertising & partners',
    blurb: 'Reaching anglers with your brand.',
    items: [
      {
        id: 'ad-options',
        q: 'What advertising is available?',
        a: [
          'Options include the home page hero carousel, banner ads, featured listings for tournaments, series, clubs and events, and “Presented by” sponsorships. To get started, [become a partner](/partner) or [contact us](/contact).',
        ],
      },
      {
        id: 'become-partner',
        q: 'How do I become a partner?',
        a: [
          'Apply on [Partner with us](/partner). Partner accounts are reviewed before they’re activated, and we’ll follow up by email.',
        ],
      },
    ],
  },
  {
    id: 'support',
    title: 'Account & support',
    blurb: 'Help with your account.',
    items: [
      {
        id: 'forgot-password',
        q: 'I forgot my password. What do I do?',
        a: ['Use [Forgot password](/forgot-password) on the login page. If you signed up with Google, choose “Sign in with Google” instead.'],
      },
      {
        id: 'account-paused',
        q: 'My account says it’s pending or paused.',
        a: [
          'Pending means your account is waiting for approval. Judges wait for their director, and partners wait for HOOX review. You’ll get an email once it’s approved. If your account is paused, please [contact us](/contact).',
        ],
      },
      {
        id: 'contact',
        q: 'How do I contact HOOX?',
        a: ['Visit [Contact Us](/contact) and we’ll get back to you.'],
      },
    ],
  },
];

/** Plain text (links reduced to their labels), for search and structured data */
export const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
