export interface Video {
  id: string
  title: string
  description: string
  thumbnail: string | null
  duration: number
  category: string
  releaseDate: string
  trader: string
  free: boolean
  locked?: boolean
  views: number
}

export interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  specialty: string[]
  image: string | null
  imagePosition?: string
  imageScale?: number
  socials?: {
    instagram?: string
    twitter?: string
    youtube?: string
    tiktok?: string
  }
}

export interface Module {
  id: string
  title: string
  description: string
  lessons: number
  duration: string
  locked: boolean
  progress: number
}

export interface Announcement {
  id: string
  title: string
  body: string
  date: string
  type: 'content' | 'platform' | 'update' | 'welcome'
  isNew: boolean
}

export interface LiveSession {
  id: string
  title: string
  description: string
  date: string
  time: string
  duration: string
  trader: string
  locked: boolean
  recurring: string
}

export interface DashboardStat {
  label: string
  value: string
  sublabel: string
  change: string
}

export const mockFreeVideos: Video[] = [
  {
    id: '1',
    title: 'Weekly Outlook — DXY & Gold Setup',
    description: 'Breaking down the Dollar Index and Gold setups heading into next week. Key levels, narrative, and execution zones.',
    thumbnail: null,
    duration: 1847,
    category: 'Weekly Outlook',
    releaseDate: '2026-05-19',
    trader: 'Trader One',
    free: true,
    views: 2341,
  },
  {
    id: '2',
    title: 'Market Breakdown — NASDAQ Structure Shift',
    description: "The NASDAQ has printed a clean structure shift. Here's what we're watching and why this matters for entries this week.",
    thumbnail: null,
    duration: 1234,
    category: 'Market Breakdown',
    releaseDate: '2026-05-21',
    trader: 'Trader Two',
    free: true,
    views: 1876,
  },
  {
    id: '3',
    title: 'Trading Psychology — Managing Drawdown',
    description: 'How top traders maintain discipline through drawdown periods. The mental frameworks that separate funded traders from the rest.',
    thumbnail: null,
    duration: 956,
    category: 'Psychology',
    releaseDate: '2026-05-22',
    trader: 'Trader Three',
    free: true,
    views: 3102,
  },
  {
    id: '4',
    title: 'Gold HTF Analysis — May Outlook',
    description: 'High time frame analysis for Gold. Monthly and weekly structure with premium/discount zones mapped.',
    thumbnail: null,
    duration: 2100,
    category: 'Weekly Outlook',
    releaseDate: '2026-05-12',
    trader: 'Trader One',
    free: true,
    views: 4230,
  },
  {
    id: '5',
    title: 'Risk Management — Position Sizing Masterclass',
    description: 'The exact position sizing model we use across funded accounts. Scaling in, max drawdown rules, and correlation management.',
    thumbnail: null,
    duration: 1680,
    category: 'Risk Management',
    releaseDate: '2026-05-14',
    trader: 'Trader Four',
    free: true,
    views: 5621,
  },
  {
    id: '6',
    title: 'FX Pairs — EUR/USD & GBP/JPY Review',
    description: "Full review of last week's FX setups. What hit, what missed, and the lessons from execution.",
    thumbnail: null,
    duration: 1453,
    category: 'Market Breakdown',
    releaseDate: '2026-05-16',
    trader: 'Trader Two',
    free: true,
    views: 2897,
  },
]

export const mockTeam: TeamMember[] = [
  {
    id: '3',
    name: 'Bani',
    role: 'Founder & Lead Strategist',
    bio: 'Deep expertise in forex pairs with a focus on psychology, funded account performance, and consistent execution under pressure.',
    specialty: ['EUR/USD', 'GBP/JPY', 'Psychology'],
    image: '/mentor3.png',
    imagePosition: '20% top',
    socials: {
      instagram: 'https://www.instagram.com/tradebani/',
      youtube: 'https://www.youtube.com/@tradebani',
      tiktok: 'https://www.tiktok.com/@tradebani',
      twitter: 'https://x.com/tradebani',
    },
  },
  {
    id: '2',
    name: 'Albin',
    role: 'Senior Analyst & Mentor',
    bio: 'Focuses on equity indices and high-probability liquidity setups. Known for clean, systematic execution across NASDAQ and S&P futures.',
    specialty: ['NASDAQ', 'S&P 500', 'Indices'],
    image: '/mentor2.png',
    socials: {
      instagram: 'https://www.instagram.com/abtradingg/',
      twitter: 'https://x.com/ABTradingg',
      youtube: 'https://www.youtube.com/@ABTradingg',
      tiktok: 'https://www.tiktok.com/@abtradings',
    },
  },
  {
    id: '1',
    name: 'Ibby',
    role: 'Funded Trader & Strategist',
    bio: 'Specialist in macro market structure and Gold/DXY correlation. Eight years of professional trading experience with a focus on high time frame narrative.',
    specialty: ['Gold', 'DXY', 'Macro'],
    image: '/mentor1.png',
    imagePosition: '35% 0%',
    imageScale: 1.15,
    socials: {
      instagram: 'https://instagram.com/',
      tiktok: 'https://www.tiktok.com/@ibby5gm',
      youtube: 'https://www.youtube.com/@Ibby5GM',
    },
  },
  {
    id: '4',
    name: 'Mubz',
    role: 'Funded Trader & Mentor',
    bio: 'Risk management expert specialising in funded account strategies, position sizing models, and long-term capital preservation.',
    specialty: ['Risk Management', 'Funding', 'Execution'],
    image: '/mentor4.png',
    imagePosition: '80% top',
    imageScale: 1.15,
    socials: {
      instagram: 'https://www.instagram.com/trademubz/',
      twitter: 'https://x.com/TradeMubz',
      tiktok: 'https://www.tiktok.com/@trademubz',
      youtube: 'https://www.youtube.com/@TradeMubz',
    },
  },
]

export const mockModules: Module[] = [
  { id: '1', title: 'Foundations', description: 'Market mechanics, order flow, and the fundamental framework of professional trading.', lessons: 12, duration: '4.5 hrs', locked: true, progress: 0 },
  { id: '2', title: 'Market Structure', description: 'How institutional money moves. BOS, CHoCH, internal and external range liquidity.', lessons: 18, duration: '7 hrs', locked: true, progress: 0 },
  { id: '3', title: 'Liquidity', description: 'Mapping liquidity pools, equal highs/lows, and the mechanics of stop hunts.', lessons: 15, duration: '6 hrs', locked: true, progress: 0 },
  { id: '4', title: 'PD Arrays', description: 'Premium and discount arrays — FVGs, order blocks, mitigation blocks, and breakers.', lessons: 20, duration: '8.5 hrs', locked: true, progress: 0 },
  { id: '5', title: 'Entries & Execution', description: 'Precision entry mechanics, confirmation models, and trigger conditions.', lessons: 16, duration: '6.5 hrs', locked: true, progress: 0 },
  { id: '6', title: 'Risk Management', description: 'Position sizing, drawdown rules, correlation management, and capital preservation.', lessons: 10, duration: '4 hrs', locked: true, progress: 0 },
  { id: '7', title: 'Psychology', description: 'The mental framework for consistency. Discipline protocols and performance psychology.', lessons: 8, duration: '3 hrs', locked: true, progress: 0 },
  { id: '8', title: 'Funded Trader Scaling', description: 'Prop firm strategies, challenge protocols, and scaling funded accounts systematically.', lessons: 14, duration: '5.5 hrs', locked: true, progress: 0 },
]

export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: "This Week's Briefings Are Live",
    body: 'Three new analyst briefings are now available in the platform. This week covers Gold structure, NASDAQ liquidity, and trading psychology from the full team.',
    date: '2026-05-22',
    type: 'content',
    isNew: true,
  },
  {
    id: '2',
    title: 'Gold Tier — Update',
    body: "5GM Gold is in final preparation. The development modules, weekly outlooks, live sessions, and strategy vault are all being prepared before launch. Access details will be announced to platform members first. Stay close.",
    date: '2026-05-20',
    type: 'platform',
    isNew: true,
  },
  {
    id: '3',
    title: 'Platform Update — Dashboard Refresh',
    body: "We've refined the dashboard layout, improved content navigation, and enhanced the mobile experience. More updates are in progress ahead of Gold launch.",
    date: '2026-05-17',
    type: 'update',
    isNew: false,
  },
  {
    id: '4',
    title: 'Welcome to the 5GM Platform',
    body: 'You now have free access to weekly briefings from the 5GM analyst team. New content is released every week. Gold tier access is launching soon — platform members will be notified first.',
    date: '2026-05-10',
    type: 'welcome',
    isNew: false,
  },
]

export const mockLiveSessions: LiveSession[] = [
  {
    id: '1',
    title: 'Weekly Pre-Market Briefing',
    description: 'Full team run-through of the coming week — key pairs, levels, and trade plans before the London open.',
    date: '2026-05-26',
    time: '08:00 GMT',
    duration: '90 min',
    trader: 'Full Team',
    locked: true,
    recurring: 'Every Monday',
  },
  {
    id: '2',
    title: 'Gold & DXY Deep Dive',
    description: 'Monthly live session focused entirely on Gold and Dollar narrative. Full breakdown with Q&A.',
    date: '2026-05-28',
    time: '19:00 GMT',
    duration: '120 min',
    trader: 'Trader One',
    locked: true,
    recurring: 'Monthly',
  },
  {
    id: '3',
    title: 'Live Chart Review Session',
    description: 'Open chart review with the analyst team. Submit setups in advance for live analysis and commentary.',
    date: '2026-05-30',
    time: '18:00 GMT',
    duration: '60 min',
    trader: 'Full Team',
    locked: true,
    recurring: 'Bi-weekly',
  },
]

export const mockDashboardStats: DashboardStat[] = [
  { label: 'Free Briefings', value: '24', sublabel: 'Videos available', change: '+3 this week' },
  { label: 'Gold Modules', value: '8', sublabel: 'Courses in preparation', change: 'Gold access required' },
  { label: 'Live Sessions', value: '3', sublabel: 'Upcoming this month', change: 'Gold access required' },
  { label: 'Market Breakdowns', value: '18', sublabel: 'Analyses available', change: '+2 this week' },
]

export const mockMarketBreakdowns: Video[] = [
  { id: 'mb1', title: 'Gold — May Structure Analysis', trader: 'Trader One', free: true, duration: 1240, category: 'Commodities', description: 'Full breakdown of Gold structure heading into the second half of May.', views: 3210, thumbnail: null, releaseDate: '2026-05-22' },
  { id: 'mb2', title: 'EUR/USD — Weekly Bias', trader: 'Trader Three', free: true, duration: 980, category: 'FX Majors', description: 'Euro dollar narrative and key levels for the week.', views: 2104, thumbnail: null, releaseDate: '2026-05-21' },
  { id: 'mb3', title: 'NASDAQ — Liquidity Raid Confirmed', trader: 'Trader Two', free: false, locked: true, duration: 1560, category: 'Indices', description: 'NASDAQ has confirmed a liquidity grab. Premium analysis with entry zones.', views: 0, thumbnail: null, releaseDate: '2026-05-20' },
  { id: 'mb4', title: 'BTC — Macro Outlook', trader: 'Trader Four', free: false, locked: true, duration: 1100, category: 'Crypto', description: 'Bitcoin high time frame structure and macro correlation analysis.', views: 0, thumbnail: null, releaseDate: '2026-05-19' },
  { id: 'mb5', title: 'GBP/JPY — Setup Review', trader: 'Trader Three', free: true, duration: 720, category: 'FX', description: "Review of last week's GBPJPY trade — entry, management, and lessons.", views: 1893, thumbnail: null, releaseDate: '2026-05-16' },
  { id: 'mb6', title: 'S&P 500 — Institutional Flow', trader: 'Trader Two', free: false, locked: true, duration: 1890, category: 'Indices', description: 'Deep institutional order flow analysis for S&P 500.', views: 0, thumbnail: null, releaseDate: '2026-05-15' },
]

export const mockRevisionMaterials = [
  { id: '1', title: 'Market Structure Cheatsheet', type: 'PDF', pages: 4, locked: true, description: 'Visual reference for BOS, CHoCH, and internal/external liquidity.' },
  { id: '2', title: 'PD Arrays Quick Reference', type: 'PDF', pages: 6, locked: true, description: 'Every PD array defined with visual examples and usage notes.' },
  { id: '3', title: 'Entry Model Checklist', type: 'Checklist', pages: 2, locked: true, description: '10-point pre-entry checklist for high-probability setups.' },
  { id: '4', title: 'Daily Trader Routine', type: 'PDF', pages: 3, locked: true, description: 'The exact pre-market and post-session routine used by the team.' },
  { id: '5', title: 'Risk Management Worksheet', type: 'Worksheet', pages: 2, locked: true, description: 'Position sizing calculator and max loss framework.' },
  { id: '6', title: 'Psychology Flashcards', type: 'Flashcards', pages: 20, locked: true, description: '20 mental models and principles for trading psychology.' },
]

export const mockStrategyVault = [
  { id: '1', title: 'The Gold Playbook', type: 'Playbook', description: 'Complete setup-to-target execution model for Gold trades.', locked: true },
  { id: '2', title: 'Liquidity Hunt Framework', type: 'Framework', description: 'Step-by-step process for identifying and trading liquidity hunts.', locked: true },
  { id: '3', title: 'Indices Session Model', type: 'Model', description: 'How to trade NASDAQ and S&P across the NY session with precision.', locked: true },
  { id: '4', title: 'FX Pairs Execution Manual', type: 'Manual', description: 'Full execution guide for major and minor FX pairs.', locked: true },
  { id: '5', title: 'Funded Account Protocol', type: 'Protocol', description: 'Rules, risk limits, and daily processes for prop firm accounts.', locked: true },
  { id: '6', title: 'Correlation Matrix', type: 'Reference', description: 'Asset correlation reference for managing portfolio exposure.', locked: true },
]
