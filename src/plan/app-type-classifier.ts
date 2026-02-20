export type AppType =
  | 'team-collaboration'
  | 'e-commerce'
  | 'content-social'
  | 'utility-tool'
  | 'fitness-health'
  | 'education'
  | 'general';

export interface ModuleSuggestion {
  moduleId: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

export interface AppTypeResult {
  type: AppType;
  confidence: number;
  suggestedModules: ModuleSuggestion[];
}

interface AppTypeDefinition {
  keywords: string[];
  modules: ModuleSuggestion[];
}

const APP_TYPE_DEFINITIONS: Record<Exclude<AppType, 'general'>, AppTypeDefinition> = {
  'team-collaboration': {
    keywords: [
      'team', 'chat', 'channel', 'message', 'collaborate', 'collaboration',
      'workspace', 'task', 'project management', 'kanban', 'board', 'member',
      'invite', 'mention', 'thread', 'notification',
    ],
    modules: [
      { moduleId: 'auth', priority: 'high', rationale: 'Team members need accounts and authentication' },
      { moduleId: 'push', priority: 'high', rationale: 'Real-time notifications for messages and task updates' },
      { moduleId: 'database', priority: 'high', rationale: 'Persistent storage for messages, tasks, and team data' },
      { moduleId: 'analytics', priority: 'medium', rationale: 'Track team engagement and feature usage' },
      { moduleId: 'deep-linking', priority: 'medium', rationale: 'Deep links to specific channels or tasks' },
      { moduleId: 'theme', priority: 'low', rationale: 'Branding and dark mode for extended use' },
    ],
  },
  'e-commerce': {
    keywords: [
      'shop', 'store', 'product', 'catalog', 'cart', 'checkout', 'payment',
      'order', 'purchase', 'buy', 'sell', 'merchant', 'inventory', 'price',
      'discount', 'coupon', 'shipping', 'delivery', 'ecommerce', 'e-commerce',
    ],
    modules: [
      { moduleId: 'auth', priority: 'high', rationale: 'User accounts for order history and personalization' },
      { moduleId: 'database', priority: 'high', rationale: 'Product catalog, orders, and user data storage' },
      { moduleId: 'api', priority: 'high', rationale: 'Payment gateway and external service integrations' },
      { moduleId: 'push', priority: 'medium', rationale: 'Order status and promotional notifications' },
      { moduleId: 'analytics', priority: 'medium', rationale: 'Track conversions, cart abandonment, and revenue' },
      { moduleId: 'deep-linking', priority: 'medium', rationale: 'Product links for marketing campaigns' },
      { moduleId: 'theme', priority: 'low', rationale: 'Brand identity and visual consistency' },
    ],
  },
  'content-social': {
    keywords: [
      'social', 'feed', 'post', 'story', 'like', 'comment', 'share', 'follow',
      'follower', 'profile', 'content', 'media', 'photo', 'video', 'reel',
      'community', 'network', 'timeline', 'trending', 'hashtag',
    ],
    modules: [
      { moduleId: 'auth', priority: 'high', rationale: 'User profiles and social identity' },
      { moduleId: 'analytics', priority: 'high', rationale: 'Content performance and user engagement metrics' },
      { moduleId: 'database', priority: 'high', rationale: 'Posts, comments, relationships, and media metadata' },
      { moduleId: 'push', priority: 'high', rationale: 'Engagement notifications for likes and comments' },
      { moduleId: 'deep-linking', priority: 'medium', rationale: 'Share links to specific posts or profiles' },
      { moduleId: 'i18n', priority: 'medium', rationale: 'Reach global audiences with localization' },
      { moduleId: 'theme', priority: 'low', rationale: 'Visual identity and user personalization' },
    ],
  },
  'utility-tool': {
    keywords: [
      'utility', 'tool', 'calculator', 'converter', 'scanner', 'generator',
      'tracker', 'planner', 'organizer', 'note', 'reminder', 'timer', 'stopwatch',
      'password', 'qr', 'barcode', 'pdf', 'file', 'offline', 'simple',
    ],
    modules: [
      { moduleId: 'theme', priority: 'high', rationale: 'Clean UI with dark mode support for a polished tool' },
      { moduleId: 'i18n', priority: 'medium', rationale: 'Localize for wider audience reach' },
      { moduleId: 'analytics', priority: 'low', rationale: 'Understand which features are most used' },
    ],
  },
  'fitness-health': {
    keywords: [
      'fitness', 'health', 'workout', 'exercise', 'gym', 'training', 'run',
      'step', 'calorie', 'diet', 'nutrition', 'sleep', 'heart rate', 'weight',
      'bmi', 'yoga', 'meditation', 'wellness', 'habit', 'goal',
    ],
    modules: [
      { moduleId: 'auth', priority: 'high', rationale: 'Personal health data requires secure user accounts' },
      { moduleId: 'database', priority: 'high', rationale: 'Persist workout logs, metrics, and progress history' },
      { moduleId: 'push', priority: 'high', rationale: 'Workout reminders and goal achievement notifications' },
      { moduleId: 'analytics', priority: 'medium', rationale: 'Progress trends and engagement insights' },
      { moduleId: 'theme', priority: 'medium', rationale: 'Energizing visuals and accessible dark mode' },
    ],
  },
  'education': {
    keywords: [
      'education', 'learning', 'course', 'lesson', 'quiz', 'exam', 'student',
      'teacher', 'tutor', 'curriculum', 'lecture', 'e-learning', 'elearning',
      'training', 'certificate', 'skill', 'knowledge', 'study', 'flashcard',
    ],
    modules: [
      { moduleId: 'auth', priority: 'high', rationale: 'Student and instructor accounts with role management' },
      { moduleId: 'database', priority: 'high', rationale: 'Courses, progress, quiz results, and certificates' },
      { moduleId: 'api', priority: 'high', rationale: 'Content delivery and third-party learning integrations' },
      { moduleId: 'push', priority: 'medium', rationale: 'Study reminders and course update notifications' },
      { moduleId: 'i18n', priority: 'medium', rationale: 'Multilingual content for global learners' },
      { moduleId: 'analytics', priority: 'low', rationale: 'Track learning outcomes and completion rates' },
    ],
  },
};

const GENERAL_MODULES: ModuleSuggestion[] = [
  { moduleId: 'auth', priority: 'high', rationale: 'User authentication is a common requirement for most apps' },
  { moduleId: 'api', priority: 'high', rationale: 'Backend API integration for data persistence and sync' },
  { moduleId: 'theme', priority: 'medium', rationale: 'Consistent branding and dark mode support' },
];

export function classifyAppType(description: string): AppTypeResult {
  const lower = description.toLowerCase();

  let bestType: Exclude<AppType, 'general'> | null = null;
  let bestScore = 0;
  let totalKeywords = 0;

  for (const [type, definition] of Object.entries(APP_TYPE_DEFINITIONS) as [Exclude<AppType, 'general'>, AppTypeDefinition][]) {
    let matchCount = 0;
    for (const keyword of definition.keywords) {
      if (lower.includes(keyword)) {
        matchCount++;
      }
    }
    totalKeywords = definition.keywords.length;
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestType = type;
      totalKeywords = definition.keywords.length;
    }
  }

  if (bestType === null || bestScore === 0) {
    return {
      type: 'general',
      confidence: 0.1,
      suggestedModules: GENERAL_MODULES,
    };
  }

  const confidence = Math.min(bestScore / Math.max(3, totalKeywords * 0.4), 1);

  return {
    type: bestType,
    confidence,
    suggestedModules: APP_TYPE_DEFINITIONS[bestType].modules,
  };
}
