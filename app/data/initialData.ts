import {
  Task,
  Project,
  TagItem,
  Collaborator,
  TaskTemplate,
  AppGoals,
  NotificationItem,
  Priority,
  TaskStatus,
} from '../types/todo';

export const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatReadableDate = (dateStr: string, timeStr?: string): string => {
  if (!dateStr) return 'No due date';
  const todayStr = getRelativeDateStr(0);
  const tomorrowStr = getRelativeDateStr(1);
  const yesterdayStr = getRelativeDateStr(-1);

  let label = dateStr;
  if (dateStr === todayStr) label = 'Today';
  else if (dateStr === tomorrowStr) label = 'Tomorrow';
  else if (dateStr === yesterdayStr) label = 'Yesterday';
  else {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (y && m && d) {
      const dateObj = new Date(y, m - 1, d);
      label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  if (timeStr) {
    const [hh, mm] = timeStr.split(':').map(Number);
    if (!isNaN(hh) && !isNaN(mm)) {
      const period = hh >= 12 ? 'PM' : 'AM';
      const hour12 = hh % 12 || 12;
      return `${label} ${hour12}:${String(mm).padStart(2, '0')} ${period}`;
    }
  }
  return label;
};

export const isTaskOverdue = (task: Task): boolean => {
  if (task.completed || task.archived || task.trashed || !task.dueDate) return false;
  const today = getRelativeDateStr(0);
  return task.dueDate < today;
};

export const isTaskToday = (task: Task): boolean => {
  if (task.archived || task.trashed) return false;
  return task.dueDate === getRelativeDateStr(0);
};

export const isTaskUpcoming = (task: Task): boolean => {
  if (task.completed || task.archived || task.trashed || !task.dueDate) return false;
  return task.dueDate > getRelativeDateStr(0);
};

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  return `${secs}s`;
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; badgeBg: string; textColor: string; dotColor: string; borderLeft: string; weight: number }
> = {
  urgent: {
    label: 'Urgent',
    badgeBg: 'bg-rose-500/15 dark:bg-rose-500/20 border-rose-500/30',
    textColor: 'text-rose-600 dark:text-rose-400',
    dotColor: 'bg-rose-500',
    borderLeft: 'border-l-rose-500',
    weight: 4,
  },
  high: {
    label: 'High Priority',
    badgeBg: 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-500/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    borderLeft: 'border-l-amber-500',
    weight: 3,
  },
  medium: {
    label: 'Medium',
    badgeBg: 'bg-sky-500/15 dark:bg-sky-500/20 border-sky-500/30',
    textColor: 'text-sky-600 dark:text-sky-400',
    dotColor: 'bg-sky-500',
    borderLeft: 'border-l-sky-500',
    weight: 2,
  },
  low: {
    label: 'Low',
    badgeBg: 'bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    borderLeft: 'border-l-emerald-500',
    weight: 1,
  },
};

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  todo: {
    label: 'To Do',
    color: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800',
    dot: 'bg-slate-400',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/15 dark:bg-indigo-500/20',
    dot: 'bg-indigo-500',
  },
  review: {
    label: 'Review',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/15 dark:bg-amber-500/20',
    dot: 'bg-amber-500',
  },
  done: {
    label: 'Done',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    dot: 'bg-emerald-500',
  },
};

export const INITIAL_COLLABORATORS: Collaborator[] = [
  {
    id: 'c1',
    name: 'Alex Rivera (You)',
    email: 'alex@workspace.dev',
    role: 'Product Lead',
    initials: 'AR',
    color: 'bg-indigo-600',
  },
  {
    id: 'c2',
    name: 'Maya Lin',
    email: 'maya@workspace.dev',
    role: 'Senior Designer',
    initials: 'ML',
    color: 'bg-pink-600',
  },
  {
    id: 'c3',
    name: 'Liam Patel',
    email: 'liam@workspace.dev',
    role: 'Full-Stack Eng',
    initials: 'LP',
    color: 'bg-emerald-600',
  },
  {
    id: 'c4',
    name: 'Sofia Chen',
    email: 'sofia@workspace.dev',
    role: 'QA & Ops',
    initials: 'SC',
    color: 'bg-amber-600',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  { id: 'p-work', name: 'Work', color: '#6366f1', icon: '💼' },
  { id: 'p-personal', name: 'Personal', color: '#10b981', icon: '🏠' },
  { id: 'p-study', name: 'Study', color: '#f59e0b', icon: '📚' },
  { id: 'p-health', name: 'Health & Fitness', color: '#ec4899', icon: '🏋️' },
  { id: 'p-finance', name: 'Finance', color: '#06b6d4', icon: '💳' },
];

export const INITIAL_TAGS: TagItem[] = [
  { id: 't1', name: 'Frontend', color: '#6366f1' },
  { id: 't2', name: 'Deep Work', color: '#8b5cf6' },
  { id: 't3', name: 'Urgent', color: '#f43f5e' },
  { id: 't4', name: 'Design', color: '#ec4899' },
  { id: 't5', name: 'Exam Prep', color: '#f59e0b' },
  { id: 't6', name: 'Errands', color: '#10b981' },
  { id: 't7', name: 'Meeting', color: '#0ea5e9' },
  { id: 't8', name: 'Research', color: '#14b8a6' },
];

export const INITIAL_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Sprint Release Checklist',
    icon: '🚀',
    description: 'End-to-end production deployment and QA signoff checklist',
    priority: 'high',
    category: 'Work',
    tags: ['Frontend', 'Deep Work'],
    estimatedTime: 90,
    recurrence: 'weekly',
    subtasks: [
      'Run unit and integration test suites',
      'Verify staging environment build',
      'Review Lighthouse performance metrics',
      'Update changelog and release notes',
      'Deploy to production and monitor logs',
    ],
    notes: 'Ensure all PRs are approved by at least 2 reviewers before merging to main.',
  },
  {
    id: 'tpl-2',
    name: 'Deep Study Session (Pomodoro x2)',
    icon: '🎓',
    description: 'Structured 50-minute active recall and problem-solving session',
    priority: 'medium',
    category: 'Study',
    tags: ['Exam Prep', 'Deep Work'],
    estimatedTime: 50,
    recurrence: 'daily',
    subtasks: [
      'Review lecture flashcards (10 mins)',
      'Complete 3 practice problems without notes',
      'Summarize key concepts in own words',
      'Log weak areas for tomorrow',
    ],
    notes: 'Use active recall and spaced repetition. Keep phone in another room.',
  },
  {
    id: 'tpl-3',
    name: 'Daily Morning Routine',
    icon: '🌅',
    description: 'Start the day energized, hydrated, and focused on top 3 goals',
    priority: 'medium',
    category: 'Health & Fitness',
    tags: ['Errands'],
    estimatedTime: 45,
    recurrence: 'daily',
    subtasks: [
      'Drink 500ml water & stretch for 5 mins',
      '20-minute cardio or strength workout',
      'Review Today view and pick Top 3 priorities',
    ],
    notes: 'Consistency builds momentum!',
  },
  {
    id: 'tpl-4',
    name: 'Bug Triage & Root Cause Analysis',
    icon: '🐛',
    description: 'Investigate, reproduce, and patch critical issue',
    priority: 'urgent',
    category: 'Work',
    tags: ['Frontend', 'Urgent'],
    estimatedTime: 60,
    recurrence: 'none',
    subtasks: [
      'Reproduce bug locally in dev environment',
      'Identify root cause and affected components',
      'Write regression test case',
      'Implement fix and submit PR',
    ],
    notes: 'Attach error stack trace and screen recording to task attachments.',
  },
];

export const INITIAL_GOALS: AppGoals = {
  dailyTasksGoal: 5,
  weeklyTasksGoal: 20,
  dailyFocusMinutesGoal: 120,
  streakDays: 12,
  bestStreak: 19,
  lastCompletedDate: getRelativeDateStr(0),
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Reminder: Ship v2.4 UI Redesign',
    message: 'Due today at 6:00 PM · 3/5 subtasks completed',
    time: '10m ago',
    read: false,
    taskId: 'task-1',
    type: 'reminder',
  },
  {
    id: 'n2',
    title: '12-Day Productivity Streak!',
    message: 'You have hit your daily goal 12 days in a row. Keep going!',
    time: '1h ago',
    read: false,
    type: 'achievement',
  },
  {
    id: 'n3',
    title: 'AI Insight Ready',
    message: '2 overdue tasks can be rescheduled or broken into quick 15m steps.',
    time: '2h ago',
    read: true,
    type: 'ai',
  },
];

export const getInitialTasks = (): Task[] => {
  const today = getRelativeDateStr(0);
  const tomorrow = getRelativeDateStr(1);
  const inTwoDays = getRelativeDateStr(2);
  const inFourDays = getRelativeDateStr(4);
  const yesterday = getRelativeDateStr(-1);
  const twoDaysAgo = getRelativeDateStr(-2);

  return [
    {
      id: 'task-1',
      title: 'Finalize & Ship v2.4 Productivity Dashboard UI',
      description:
        'Complete the interactive Kanban board, Calendar drag-and-drop scheduling, and real-time analytics charts for the Q4 release.',
      status: 'in-progress',
      completed: false,
      priority: 'high',
      category: 'Work',
      tags: ['Frontend', 'Design', 'Deep Work'],
      dueDate: today,
      dueTime: '18:00',
      reminder: true,
      reminderTime: '17:30',
      recurrence: 'none',
      subtasks: [
        { id: 's1-1', title: 'Audit dark mode contrast ratios across cards', completed: true },
        { id: 's1-2', title: 'Implement Kanban column drag & drop', completed: true },
        { id: 's1-3', title: 'Wire up Pomodoro timer with task time logging', completed: true },
        { id: 's1-4', title: 'Verify keyboard shortcuts (Ctrl+K, Undo/Redo)', completed: false },
        { id: 's1-5', title: 'Final code review with Maya and Liam', completed: false },
      ],
      dependencies: [],
      notes:
        'Key design requirement: each task card must clearly show Priority, Category, Due Time, Tags, and Subtask progress (3/5) at a glance.',
      attachments: [
        {
          id: 'att-1',
          name: 'Figma_Dashboard_Specs_v2.4.pdf',
          size: '4.2 MB',
          type: 'file',
          url: 'https://figma.com',
          addedAt: 'Yesterday, 4:15 PM',
        },
        {
          id: 'att-2',
          name: 'Component_Architecture_Notes.md',
          size: '128 KB',
          type: 'doc',
          url: 'https://nextjs.org/docs',
          addedAt: 'Today, 9:30 AM',
        },
      ],
      timeSpent: 4320,
      estimatedTime: 90,
      important: true,
      archived: false,
      trashed: false,
      order: 1,
      assignees: ['c1', 'c2'],
      activity: [
        {
          id: 'act-1',
          text: 'Created task in Work',
          timestamp: 'Yesterday, 2:00 PM',
          user: 'Alex Rivera',
          type: 'system',
        },
        {
          id: 'act-2',
          text: 'Updated design specs and uploaded Figma PDF',
          timestamp: 'Yesterday, 4:15 PM',
          user: 'Maya Lin',
          type: 'comment',
        },
        {
          id: 'act-3',
          text: 'Completed 3 of 5 subtasks',
          timestamp: 'Today, 11:20 AM',
          user: 'Alex Rivera',
          type: 'system',
        },
      ],
      createdAt: yesterday,
    },
    {
      id: 'task-2',
      title: 'Algorithm & Distributed Systems Exam Prep',
      description:
        'Review Raft consensus protocol, dynamic programming state transitions, and graph shortest-path proofs.',
      status: 'todo',
      completed: false,
      priority: 'urgent',
      category: 'Study',
      tags: ['Exam Prep', 'Deep Work', 'Research'],
      dueDate: today,
      dueTime: '20:30',
      reminder: true,
      reminderTime: '19:00',
      recurrence: 'daily',
      subtasks: [
        { id: 's2-1', title: 'Read MIT 6.824 Raft paper notes', completed: true },
        { id: 's2-2', title: 'Solve 4 LeetCode Hard DP problems', completed: false },
        { id: 's2-3', title: 'Write summary sheet for Dijkstra & Bellman-Ford', completed: false },
      ],
      dependencies: [],
      notes: 'Focus on leader election edge cases and log replication safety invariants.',
      attachments: [
        {
          id: 'att-3',
          name: 'Raft_Consensus_Annotated.pdf',
          size: '1.8 MB',
          type: 'file',
          url: 'https://raft.github.io',
          addedAt: '2 days ago',
        },
      ],
      timeSpent: 2700,
      estimatedTime: 120,
      important: true,
      archived: false,
      trashed: false,
      order: 2,
      assignees: ['c1'],
      activity: [
        {
          id: 'act-201',
          text: 'Set recurring schedule to Daily',
          timestamp: '2 days ago',
          user: 'Alex Rivera',
          type: 'system',
        },
      ],
      createdAt: twoDaysAgo,
    },
    {
      id: 'task-3',
      title: 'Fix Production OAuth Token Refresh Race Condition',
      description:
        'Concurrent API requests during token expiry trigger duplicate refresh calls and invalidate active sessions.',
      status: 'review',
      completed: false,
      priority: 'urgent',
      category: 'Work',
      tags: ['Urgent', 'Frontend'],
      dueDate: yesterday,
      dueTime: '17:00',
      reminder: true,
      reminderTime: '16:00',
      recurrence: 'none',
      subtasks: [
        { id: 's3-1', title: 'Implement mutex lock on refresh queue', completed: true },
        { id: 's3-2', title: 'Add unit tests for concurrent 401 responses', completed: true },
        { id: 's3-3', title: 'QA verification on staging cluster', completed: false },
      ],
      dependencies: [],
      notes: 'PR #418 is up for review. Waiting on Sofia for final staging sign-off.',
      attachments: [],
      timeSpent: 5400,
      estimatedTime: 60,
      important: true,
      archived: false,
      trashed: false,
      order: 3,
      assignees: ['c1', 'c3', 'c4'],
      activity: [
        {
          id: 'act-301',
          text: 'Moved status to Review',
          timestamp: 'Yesterday, 5:10 PM',
          user: 'Liam Patel',
          type: 'system',
        },
      ],
      createdAt: twoDaysAgo,
    },
    {
      id: 'task-4',
      title: 'Deploy Production Release v2.4 to Cloud Cluster',
      description:
        'Execute zero-downtime blue/green rollout once UI dashboard and OAuth hotfix are both signed off.',
      status: 'todo',
      completed: false,
      priority: 'high',
      category: 'Work',
      tags: ['Frontend', 'Meeting'],
      dueDate: tomorrow,
      dueTime: '14:00',
      reminder: true,
      reminderTime: '13:30',
      recurrence: 'weekly',
      subtasks: [
        { id: 's4-1', title: 'Snapshot production database', completed: false },
        { id: 's4-2', title: 'Trigger GitHub Actions release workflow', completed: false },
        { id: 's4-3', title: 'Post release announcement in #general', completed: false },
      ],
      dependencies: ['task-1', 'task-3'],
      notes: 'Blocked until both Task #1 (Dashboard UI) and Task #3 (OAuth Hotfix) are marked Done.',
      attachments: [],
      timeSpent: 600,
      estimatedTime: 45,
      important: false,
      archived: false,
      trashed: false,
      order: 4,
      assignees: ['c1', 'c3'],
      activity: [],
      createdAt: yesterday,
    },
    {
      id: 'task-5',
      title: 'Evening 5K Run & Mobility Stretching',
      description: 'Zone 2 aerobic pace followed by 15 minutes of hip and shoulder mobility.',
      status: 'todo',
      completed: false,
      priority: 'medium',
      category: 'Health & Fitness',
      tags: ['Errands'],
      dueDate: today,
      dueTime: '19:00',
      reminder: false,
      recurrence: 'daily',
      subtasks: [
        { id: 's5-1', title: '5 min dynamic warm-up', completed: true },
        { id: 's5-2', title: '5km outdoor run', completed: false },
        { id: 's5-3', title: 'Post-run electrolytes & stretching', completed: false },
      ],
      dependencies: [],
      notes: 'Aim for 5:15/km splits.',
      attachments: [],
      timeSpent: 900,
      estimatedTime: 45,
      important: false,
      archived: false,
      trashed: false,
      order: 5,
      assignees: ['c1'],
      activity: [],
      createdAt: today,
    },
    {
      id: 'task-6',
      title: 'Rebalance Monthly Investment Portfolio & Budget',
      description: 'Review Q3 expense categories, index ETF allocation, and emergency fund yield.',
      status: 'todo',
      completed: false,
      priority: 'low',
      category: 'Finance',
      tags: ['Errands'],
      dueDate: twoDaysAgo,
      dueTime: '12:00',
      reminder: true,
      recurrence: 'monthly',
      subtasks: [
        { id: 's6-1', title: 'Export credit card CSV statements', completed: true },
        { id: 's6-2', title: 'Update spreadsheet savings rate', completed: false },
      ],
      dependencies: [],
      notes: 'Check high-yield savings APY rates.',
      attachments: [],
      timeSpent: 1200,
      estimatedTime: 30,
      important: false,
      archived: false,
      trashed: false,
      order: 6,
      assignees: ['c1'],
      activity: [],
      createdAt: twoDaysAgo,
    },
    {
      id: 'task-7',
      title: 'Conduct User Interviews for AI Assistant Feature',
      description: 'Interview 5 power users about automatic task breakdown and smart daily scheduling.',
      status: 'in-progress',
      completed: false,
      priority: 'medium',
      category: 'Work',
      tags: ['Research', 'Meeting', 'Design'],
      dueDate: inTwoDays,
      dueTime: '15:30',
      reminder: true,
      recurrence: 'none',
      subtasks: [
        { id: 's7-1', title: 'Prepare interview script & prototype link', completed: true },
        { id: 's7-2', title: 'Interview sessions 1-3', completed: true },
        { id: 's7-3', title: 'Interview sessions 4-5', completed: false },
        { id: 's7-4', title: 'Synthesize insights into affinity map', completed: false },
      ],
      dependencies: [],
      notes: 'Users love the 1-click AI subtask generator inside the details drawer.',
      attachments: [],
      timeSpent: 3600,
      estimatedTime: 120,
      important: true,
      archived: false,
      trashed: false,
      order: 7,
      assignees: ['c2', 'c1'],
      activity: [],
      createdAt: yesterday,
    },
    {
      id: 'task-8',
      title: 'Order Ergonomic Mechanical Keycaps & Desk Mat',
      description: 'Pick up PBT keycaps and felt desk mat for home office setup.',
      status: 'todo',
      completed: false,
      priority: 'low',
      category: 'Personal',
      tags: ['Errands'],
      dueDate: inFourDays,
      dueTime: '11:00',
      reminder: false,
      recurrence: 'none',
      subtasks: [],
      dependencies: [],
      notes: '',
      attachments: [],
      timeSpent: 300,
      estimatedTime: 15,
      important: false,
      archived: false,
      trashed: false,
      order: 8,
      assignees: ['c1'],
      activity: [],
      createdAt: today,
    },
    {
      id: 'task-9',
      title: 'Set Up Next.js 16 + Tailwind v4 Design System Tokens',
      description: 'Configure dark mode custom variants, typography variables, and responsive layout shell.',
      status: 'done',
      completed: true,
      priority: 'high',
      category: 'Work',
      tags: ['Frontend', 'Design'],
      dueDate: today,
      dueTime: '10:00',
      reminder: false,
      recurrence: 'none',
      subtasks: [
        { id: 's9-1', title: 'Configure Tailwind v4 @custom-variant dark', completed: true },
        { id: 's9-2', title: 'Create reusable status & priority tokens', completed: true },
      ],
      dependencies: [],
      notes: 'Completed ahead of schedule.',
      attachments: [],
      timeSpent: 2400,
      estimatedTime: 45,
      important: true,
      archived: false,
      trashed: false,
      order: 9,
      assignees: ['c1', 'c2'],
      activity: [],
      createdAt: yesterday,
      completedAt: today,
    },
    {
      id: 'task-10',
      title: 'Morning Hydration & 15-Min Mindfulness Meditation',
      description: 'Guided breathwork session before opening emails or Slack.',
      status: 'done',
      completed: true,
      priority: 'medium',
      category: 'Health & Fitness',
      tags: ['Errands'],
      dueDate: today,
      dueTime: '08:00',
      reminder: false,
      recurrence: 'daily',
      subtasks: [
        { id: 's10-1', title: 'Drink 500ml water with lemon', completed: true },
        { id: 's10-2', title: '15-minute Headspace session', completed: true },
      ],
      dependencies: [],
      notes: 'Great focus boost.',
      attachments: [],
      timeSpent: 900,
      estimatedTime: 20,
      important: false,
      archived: false,
      trashed: false,
      order: 10,
      assignees: ['c1'],
      activity: [],
      createdAt: today,
      completedAt: today,
    },
  ];
};

export const generateAISubtasks = (title: string, category: string): string[] => {
  const lower = title.toLowerCase();
  if (lower.includes('exam') || lower.includes('study') || category === 'Study') {
    return [
      'Outline core syllabus topics & high-weightage concepts',
      'Active recall session: 25m Pomodoro on key definitions',
      'Solve 5 past-paper or practice problems under timed conditions',
      'Review mistakes and create a 1-page cheat sheet',
    ];
  }
  if (lower.includes('bug') || lower.includes('fix') || lower.includes('oauth') || lower.includes('error')) {
    return [
      'Reproduce the issue with a minimal test case',
      'Inspect network logs and state transitions for root cause',
      'Implement defensive fix and edge-case handling',
      'Write automated regression test & verify on staging',
    ];
  }
  if (lower.includes('ship') || lower.includes('ui') || lower.includes('design') || lower.includes('dashboard')) {
    return [
      'Finalize component props and responsive breakpoints',
      'Implement interactive states, animations & dark mode polish',
      'Verify accessibility & keyboard navigation flows',
      'Run production build check and QA walkthrough',
    ];
  }
  if (lower.includes('run') || lower.includes('workout') || category === 'Health & Fitness') {
    return [
      '5-minute dynamic joint warm-up & hydration',
      'Complete main training block at target heart rate',
      '10-minute static stretching & cooldown',
      'Log session metrics and recovery notes',
    ];
  }
  return [
    `Clarify scope and success criteria for "${title.slice(0, 28)}..."`,
    'Complete first 25-minute focused Pomodoro sprint',
    'Review progress and resolve any blockers or dependencies',
    'Final quality check and mark task complete',
  ];
};

