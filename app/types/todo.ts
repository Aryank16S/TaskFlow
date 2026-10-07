export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: 'file' | 'link' | 'image' | 'doc';
  url: string;
  addedAt: string;
}

export interface ActivityLog {
  id: string;
  text: string;
  timestamp: string;
  user: string;
  type: 'system' | 'comment';
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  completed: boolean;
  priority: Priority;
  category: string;
  tags: string[];
  dueDate: string;
  dueTime: string;
  reminder: boolean;
  reminderTime?: string;
  recurrence: RecurrencePattern;
  subtasks: Subtask[];
  dependencies: string[];
  notes: string;
  attachments: Attachment[];
  timeSpent: number;
  estimatedTime: number;
  important: boolean;
  archived: boolean;
  trashed: boolean;
  order: number;
  assignees: string[];
  activity: ActivityLog[];
  createdAt: string;
  completedAt?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  priority: Priority;
  category: string;
  tags: string[];
  estimatedTime: number;
  recurrence: RecurrencePattern;
  subtasks: string[];
  notes: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface TagItem {
  id: string;
  name: string;
  color: string;
}

export interface AppGoals {
  dailyTasksGoal: number;
  weeklyTasksGoal: number;
  dailyFocusMinutesGoal: number;
  streakDays: number;
  bestStreak: number;
  lastCompletedDate: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  taskId?: string;
  type: 'reminder' | 'achievement' | 'system' | 'ai';
}

export type SidebarView =
  | 'dashboard'
  | 'today'
  | 'upcoming'
  | 'inbox'
  | 'important'
  | 'overdue'
  | 'completed'
  | 'analytics'
  | 'archive'
  | 'trash'
  | 'profile';

export type DisplayMode = 'list' | 'kanban' | 'calendar';

export interface FilterState {
  search: string;
  priority: Priority | 'all';
  status: TaskStatus | 'all';
  category: string | 'all';
  tag: string | 'all';
  recurrence: RecurrencePattern | 'all';
  sortBy: 'order' | 'priority' | 'dueDate' | 'createdAt' | 'title';
}

