export type ChangelogCategory = 'new' | 'improved' | 'fixed'

export interface ChangelogEntry {
  id: string
  version: string
  date: string
  title: string
  description: string
  location: string
  icon: string
  category: ChangelogCategory
}

export const CURRENT_VERSION = '4.0.0'

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    id: 'workflow-automation',
    version: '4.0.0',
    date: '2026-04-13',
    title: 'Workflow Automation',
    description: 'Automate repetitive tasks with trigger-based workflows. Set up rules to create tasks, send notifications, and schedule events when deals move stages, contacts are added, or tasks are completed.',
    location: 'Sidebar → Automations',
    icon: 'Zap',
    category: 'new',
  },
  {
    id: 'guided-tour',
    version: '4.0.0',
    date: '2026-04-13',
    title: 'Guided Feature Tour',
    description: 'New to the CRM? Take an interactive tour that highlights key features and shows you around the interface. Available anytime from Settings.',
    location: 'Settings → Take a Tour',
    icon: 'Compass',
    category: 'new',
  },
  {
    id: 'email-integration',
    version: '3.0.0',
    date: '2026-04-10',
    title: 'Email Integration',
    description: 'Compose, send, and track emails directly from the CRM. Link emails to deals and contacts, use templates, and view full conversation threads.',
    location: 'Sidebar → Emails',
    icon: 'Mail',
    category: 'new',
  },
  {
    id: 'reporting-engine',
    version: '3.0.0',
    date: '2026-04-10',
    title: 'Reporting & Analytics',
    description: 'Comprehensive reporting with pipeline analysis, revenue tracking, activity metrics, and contact insights. Filter by custom date ranges.',
    location: 'Sidebar → Reports',
    icon: 'BarChart3',
    category: 'new',
  },
  {
    id: 'document-management',
    version: '2.0.0',
    date: '2026-04-08',
    title: 'Document Management',
    description: 'Attach documents and links to deals and contacts. Upload files or add URLs to keep all relevant documents organised in one place.',
    location: 'Deal & Contact detail panels',
    icon: 'FileText',
    category: 'new',
  },
  {
    id: 'calendar-events',
    version: '2.0.0',
    date: '2026-04-08',
    title: 'Calendar & Events',
    description: 'Full calendar view with event creation, editing, and linking to deals or contacts. Track meetings, calls, viewings, and deadlines.',
    location: 'Sidebar → Calendar',
    icon: 'Calendar',
    category: 'new',
  },
  {
    id: 'notifications-realtime',
    version: '1.5.0',
    date: '2026-04-06',
    title: 'Real-time Notifications',
    description: 'Stay informed with live notifications for deal movements, task assignments, and team activity. Notifications appear instantly without refreshing.',
    location: 'Top bar → Bell icon',
    icon: 'Bell',
    category: 'improved',
  },
  {
    id: 'task-subtasks',
    version: '1.5.0',
    date: '2026-04-06',
    title: 'Subtasks & Task Kanban',
    description: 'Break tasks into subtasks with progress tracking. Drag tasks between status columns on the kanban board. Filter by priority, assignee, and due date.',
    location: 'Sidebar → Tasks',
    icon: 'CheckSquare',
    category: 'improved',
  },
  {
    id: 'visual-overhaul',
    version: '1.2.0',
    date: '2026-04-04',
    title: 'Visual Overhaul',
    description: 'Refined monochrome design with glass-effect cards, smoother transitions, dark and light theme support, and improved typography throughout.',
    location: 'Everywhere',
    icon: 'Palette',
    category: 'improved',
  },
  {
    id: 'login-redesign',
    version: '1.1.0',
    date: '2026-04-02',
    title: 'Login Page Redesign',
    description: 'Clean, modern login experience with password and magic link options. Improved contrast and accessibility with animated transitions.',
    location: 'Login page',
    icon: 'LogIn',
    category: 'fixed',
  },
]
