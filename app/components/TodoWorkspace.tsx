'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Task,
  Project,
  TagItem,
  Collaborator,
  TaskTemplate,
  AppGoals,
  NotificationItem,
  SidebarView,
  DisplayMode,
  FilterState,
  Priority,
  TaskStatus,
  RecurrencePattern,
} from '../types/todo';
import {
  getInitialTasks,
  INITIAL_PROJECTS,
  INITIAL_TAGS,
  INITIAL_COLLABORATORS,
  INITIAL_TEMPLATES,
  INITIAL_GOALS,
  INITIAL_NOTIFICATIONS,
  PRIORITY_CONFIG,
  isTaskToday,
  isTaskUpcoming,
  isTaskOverdue,
  getRelativeDateStr,
} from '../data/initialData';
import TaskCard from './TaskCard';
import TaskDetailsPanel from './TaskDetailsPanel';
import DashboardView from './DashboardView';
import KanbanView from './KanbanView';
import CalendarView from './CalendarView';
import AnalyticsView from './AnalyticsView';
import ProfileAndToolsView from './ProfileAndToolsView';
import {
  CommandPaletteModal,
  NewTaskModal,
  AISuggestionsModal,
  PomodoroWidget,
} from './Modals';

export default function TodoWorkspace() {
  // Core State
  const [tasks, setTasks] = useState<Task[]>(() => getInitialTasks());
  const [pastHistory, setPastHistory] = useState<Task[][]>([]);
  const [futureHistory, setFutureHistory] = useState<Task[][]>([]);

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tagsList, setTagsList] = useState<TagItem[]>(INITIAL_TAGS);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [templates, setTemplates] = useState<TaskTemplate[]>(INITIAL_TEMPLATES);
  const [goals, setGoals] = useState<AppGoals>(INITIAL_GOALS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );

  // Navigation & View Modes
  const [sidebarView, setSidebarView] = useState<SidebarView>('dashboard');
  const [activeProjectFilter, setActiveProjectFilter] = useState<string | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Selected Task for Right Details Drawer
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Dark / Light Mode
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Modals & Widgets
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Pomodoro & Time Tracking State
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'short-break' | 'long-break'>(
    'pomodoro'
  );
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  // Search & Advanced Filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: 'all',
    status: 'all',
    category: 'all',
    tag: 'all',
    recurrence: 'all',
    sortBy: 'order',
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sidebar Inline Add Project / Tag
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);

  // Toast Feedback Banner
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  const showToast = useCallback((title: string, message: string) => {
    setToast({ title, message });
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title,
        message,
        time: 'Just now',
        read: false,
        type: 'system',
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('nexus_todo_tasks_v2');
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
        }
      }
      const savedTheme = localStorage.getItem('nexus_todo_theme');
      if (savedTheme === 'light') {
        setDarkMode(false);
      } else {
        setDarkMode(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('nexus_todo_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('nexus_todo_theme', 'light');
    }
  }, [darkMode]);

  // Save tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexus_todo_tasks_v2', JSON.stringify(tasks));
    } catch {
      // ignore storage quota errors
    }
  }, [tasks]);

  // Helper to commit task changes with Undo/Redo history stack
  const commitTasks = useCallback(
    (updater: (prev: Task[]) => Task[]) => {
      setTasks((prev) => {
        const next = updater(prev);
        setPastHistory((h) => [...h.slice(-24), prev]);
        setFutureHistory([]);
        return next;
      });
    },
    []
  );

  // Undo & Redo handlers
  const handleUndo = useCallback(() => {
    setPastHistory((prevPast) => {
      if (prevPast.length === 0) {
        showToast('↩️ Nothing to Undo', 'You are at the earliest recorded state.');
        return prevPast;
      }
      const previousState = prevPast[prevPast.length - 1];
      setFutureHistory((f) => [tasks, ...f]);
      setTasks(previousState);
      showToast('↩️ Undid Action', 'Restored previous task state.');
      return prevPast.slice(0, -1);
    });
  }, [tasks, showToast]);

  const handleRedo = useCallback(() => {
    setFutureHistory((prevFuture) => {
      if (prevFuture.length === 0) {
        showToast('↪️ Nothing to Redo', 'No forward history available.');
        return prevFuture;
      }
      const nextState = prevFuture[0];
      setPastHistory((p) => [...p, tasks]);
      setTasks(nextState);
      showToast('↪️ Redid Action', 'Re-applied task change.');
      return prevFuture.slice(1);
    });
  }, [tasks, showToast]);

  // Live Pomodoro & Per-Task Time Tracking Tick
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          showToast(
            '🔔 Pomodoro Session Complete!',
            timerMode === 'pomodoro'
              ? 'Great focus sprint! Take a 5-minute break.'
              : 'Break finished! Ready for your next focus block?'
          );
          return timerMode === 'pomodoro' ? 25 * 60 : 5 * 60;
        }
        return prev - 1;
      });

      // Increment timeSpent on the active task if in focus mode
      if (timerMode === 'pomodoro' && activeTimerTaskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeTimerTaskId ? { ...t, timeSpent: (t.timeSpent || 0) + 1 } : t
          )
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, timerMode, activeTimerTaskId, showToast]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Ctrl + K or Cmd + K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Ctrl + Z -> Undo (when not typing in an input)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !isInput) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl + Y or Ctrl + Shift + Z -> Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !isInput) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z' && !isInput)
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setNewTaskModalOpen(false);
        setAiModalOpen(false);
        setNotificationsOpen(false);
        setSelectedTaskId(null);
        return;
      }

      if (isInput) return;

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setNewTaskModalOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDarkMode((prev) => !prev);
      } else if (e.key === '1') {
        setSidebarView('dashboard');
      } else if (e.key === '2') {
        setSidebarView('inbox');
        setDisplayMode('kanban');
      } else if (e.key === '3') {
        setSidebarView('inbox');
        setDisplayMode('calendar');
      } else if (e.key === '4') {
        setSidebarView('analytics');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Task Operations
  const handleToggleComplete = (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    // Check if blocked by incomplete dependencies
    if (!targetTask.completed && targetTask.dependencies.length > 0) {
      const blockers = targetTask.dependencies
        .map((id) => tasks.find((t) => t.id === id))
        .filter((t): t is Task => Boolean(t && !t.completed));
      if (blockers.length > 0) {
        showToast(
          '🔒 Task Blocked by Dependency',
          `Complete "${blockers[0].title}" first before finishing this task.`
        );
        return;
      }
    }

    const willComplete = !targetTask.completed;

    commitTasks((prev) => {
      const updatedList = prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          completed: willComplete,
          status: (willComplete ? 'done' : 'todo') as TaskStatus,
          completedAt: willComplete ? getRelativeDateStr(0) : undefined,
          activity: [
            {
              id: `act-${Date.now()}`,
              text: willComplete ? 'Completed task 🎉' : 'Reopened task',
              timestamp: 'Just now',
              user: 'Alex Rivera',
              type: 'system' as const,
            },
            ...t.activity,
          ],
        };
      });

      // Handle Recurring Tasks: spawn next occurrence automatically when completed!
      if (willComplete && targetTask.recurrence !== 'none') {
        const baseDate = targetTask.dueDate ? new Date(targetTask.dueDate) : new Date();
        if (targetTask.recurrence === 'daily') baseDate.setDate(baseDate.getDate() + 1);
        else if (targetTask.recurrence === 'weekly') baseDate.setDate(baseDate.getDate() + 7);
        else if (targetTask.recurrence === 'monthly') baseDate.setMonth(baseDate.getMonth() + 1);

        const nextDateStr = `${baseDate.getFullYear()}-${String(
          baseDate.getMonth() + 1
        ).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;

        const nextRecurringTask: Task = {
          ...targetTask,
          id: `task-rec-${Date.now()}`,
          completed: false,
          status: 'todo',
          dueDate: nextDateStr,
          subtasks: targetTask.subtasks.map((s) => ({ ...s, completed: false })),
          timeSpent: 0,
          createdAt: getRelativeDateStr(0),
          activity: [
            {
              id: `act-rec-${Date.now()}`,
              text: `Auto-scheduled next ${targetTask.recurrence} occurrence`,
              timestamp: 'Just now',
              user: 'System',
              type: 'system',
            },
          ],
        };

        showToast(
          '🔄 Recurring Task Scheduled',
          `Next ${targetTask.recurrence} occurrence created for ${nextDateStr}.`
        );
        return [nextRecurringTask, ...updatedList];
      }

      return updatedList;
    });
  };

  const handleToggleImportant = (taskId: string) => {
    commitTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, important: !t.important } : t))
    );
  };

  const handleToggleReminder = (taskId: string) => {
    commitTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, reminder: !t.reminder } : t))
    );
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    commitTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextSubs = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subtasks: nextSubs };
      })
    );
  };

  const handleUpdateTask = (updated: Task, logMessage?: string) => {
    commitTasks((prev) =>
      prev.map((t) => {
        if (t.id !== updated.id) return t;
        const nextActivity = logMessage
          ? [
              {
                id: `act-${Date.now()}`,
                text: logMessage,
                timestamp: 'Just now',
                user: 'Alex Rivera',
                type: 'system' as const,
              },
              ...updated.activity,
            ]
          : updated.activity;
        return { ...updated, activity: nextActivity };
      })
    );
  };

  const handleCreateTaskFull = (data: {
    title: string;
    description: string;
    priority: Priority;
    category: string;
    tags: string[];
    dueDate: string;
    dueTime: string;
    reminder: boolean;
    recurrence: RecurrencePattern;
    subtasks: string[];
    notes: string;
    important: boolean;
  }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title,
      description: data.description,
      status: 'todo',
      completed: false,
      priority: data.priority,
      category: data.category,
      tags: data.tags,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      reminder: data.reminder,
      reminderTime: data.dueTime,
      recurrence: data.recurrence,
      subtasks: data.subtasks.map((title, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title,
        completed: false,
      })),
      dependencies: [],
      notes: data.notes,
      attachments: [],
      timeSpent: 0,
      estimatedTime: 45,
      important: data.important,
      archived: false,
      trashed: false,
      order: 0,
      assignees: ['c1'],
      activity: [
        {
          id: `act-${Date.now()}`,
          text: 'Created task',
          timestamp: 'Just now',
          user: 'Alex Rivera',
          type: 'system',
        },
      ],
      createdAt: getRelativeDateStr(0),
    };

    commitTasks((prev) => [newTask, ...prev]);
    showToast('✨ Task Created', `"${newTask.title}" added to ${newTask.category}.`);
  };

  const handleQuickCreateTask = (
    title: string,
    priority: Priority,
    category: string,
    dueDate: string
  ) => {
    handleCreateTaskFull({
      title,
      description: '',
      priority,
      category,
      tags: [],
      dueDate,
      dueTime: '18:00',
      reminder: true,
      recurrence: 'none',
      subtasks: [],
      notes: '',
      important: priority === 'urgent' || priority === 'high',
    });
  };

  const handleDuplicateTask = (task: Task) => {
    const copy: Task = {
      ...task,
      id: `task-copy-${Date.now()}`,
      title: `${task.title} (Copy)`,
      completed: false,
      status: 'todo',
      createdAt: getRelativeDateStr(0),
    };
    commitTasks((prev) => [copy, ...prev]);
    showToast('📄 Task Duplicated', `Created "${copy.title}".`);
  };

  const handleSaveAsTemplate = (task: Task) => {
    const newTpl: TaskTemplate = {
      id: `custom-${Date.now()}`,
      name: task.title,
      icon: '⭐',
      description: task.description || 'Custom saved template',
      priority: task.priority,
      category: task.category,
      tags: task.tags,
      estimatedTime: task.estimatedTime || 45,
      recurrence: task.recurrence,
      subtasks: task.subtasks.map((s) => s.title),
      notes: task.notes,
    };
    setTemplates((prev) => [newTpl, ...prev]);
    showToast('📋 Saved as Template', `"${task.title}" is now available in your Templates library.`);
  };

  const handleApplyTemplate = (tpl: TaskTemplate) => {
    handleCreateTaskFull({
      title: tpl.name,
      description: tpl.description,
      priority: tpl.priority,
      category: tpl.category,
      tags: tpl.tags,
      dueDate: getRelativeDateStr(0),
      dueTime: '17:00',
      reminder: true,
      recurrence: tpl.recurrence,
      subtasks: tpl.subtasks,
      notes: tpl.notes,
      important: tpl.priority === 'urgent' || tpl.priority === 'high',
    });
  };

  const handleArchiveTask = (taskId: string) => {
    commitTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, archived: !t.archived } : t))
    );
    showToast('📦 Archive Updated', 'Task archive status updated. Press Ctrl+Z to undo.');
  };

  const handleDeleteTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    if (target.trashed) {
      commitTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('🗑️ Deleted Permanently', `"${target.title}" removed forever.`);
    } else {
      commitTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, trashed: true } : t))
      );
      showToast('🗑️ Moved to Trash', `"${target.title}" moved to Trash. Press Ctrl+Z to undo.`);
    }
  };

  const handleRestoreTask = (taskId: string) => {
    commitTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, trashed: false, archived: false } : t
      )
    );
    showToast('♻️ Task Restored', 'Task restored back to active workspace.');
  };

  const handleStartTimer = (task: Task) => {
    setActiveTimerTaskId(task.id);
    setPomodoroOpen(true);
    setTimerMode('pomodoro');
    setTimerRunning(true);
    showToast('⏱️ Focus Timer Started', `Tracking focus time for "${task.title}"`);
  };

  // Drag & Drop Reordering + Category Drop
  const handleCardDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleCardDropOnCard = (
    e: React.DragEvent<HTMLDivElement>,
    targetTask: Task
  ) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!sourceId || sourceId === targetTask.id) return;

    commitTasks((prev) => {
      const list = [...prev];
      const fromIdx = list.findIndex((t) => t.id === sourceId);
      const toIdx = list.findIndex((t) => t.id === targetTask.id);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      return list.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
    setDraggedTaskId(null);
  };

  const handleDropOnProjectSidebar = (e: React.DragEvent, projectName: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      commitTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, category: projectName } : t))
      );
      showToast('📁 Moved Category', `Task moved to ${projectName}`);
    }
    setDragOverProject(null);
    setDraggedTaskId(null);
  };

  // Export JSON & CSV
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-backup-${getRelativeDateStr(0)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 JSON Exported', 'Downloaded full tasks backup file.');
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Title',
      'Status',
      'Priority',
      'Category',
      'DueDate',
      'DueTime',
      'Tags',
      'TimeSpentSeconds',
    ];
    const rows = tasks.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.category,
      t.dueDate,
      t.dueTime,
      `"${t.tags.join(';')}"`,
      t.timeSpent,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-export-${getRelativeDateStr(0)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📊 CSV Exported', 'Downloaded spreadsheet export.');
  };

  // Compute Filtered & Sorted Tasks for Active View
  const filteredTasks = tasks
    .filter((task) => {
      // Trash & Archive views
      if (sidebarView === 'trash') return task.trashed;
      if (task.trashed) return false;

      if (sidebarView === 'archive') return task.archived;
      if (task.archived) return false;

      // Project or Tag sidebar filter
      if (activeProjectFilter && task.category !== activeProjectFilter) return false;
      if (activeTagFilter && !task.tags.includes(activeTagFilter)) return false;

      // Sidebar View filter
      if (sidebarView === 'today' && !isTaskToday(task)) return false;
      if (sidebarView === 'upcoming' && !isTaskUpcoming(task)) return false;
      if (sidebarView === 'important' && !task.important) return false;
      if (sidebarView === 'overdue' && !isTaskOverdue(task)) return false;
      if (sidebarView === 'completed' && !task.completed) return false;

      // Top Filter Bar filters
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.category !== 'all' && task.category !== filters.category) return false;
      if (filters.tag !== 'all' && !task.tags.includes(filters.tag)) return false;
      if (filters.recurrence !== 'all' && task.recurrence !== filters.recurrence)
        return false;

      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const inTitle = task.title.toLowerCase().includes(q);
        const inDesc = task.description.toLowerCase().includes(q);
        const inCat = task.category.toLowerCase().includes(q);
        const inTags = task.tags.some((tg) => tg.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inCat && !inTags) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'priority') {
        return PRIORITY_CONFIG[b.priority].weight - PRIORITY_CONFIG[a.priority].weight;
      }
      if (filters.sortBy === 'dueDate') {
        return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      }
      if (filters.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return a.order - b.order;
    });

  // Counts for Sidebar Badges
  const nonTrashed = tasks.filter((t) => !t.trashed && !t.archived);
  const countToday = nonTrashed.filter((t) => isTaskToday(t) && !t.completed).length;
  const countUpcoming = nonTrashed.filter((t) => isTaskUpcoming(t)).length;
  const countInbox = nonTrashed.filter((t) => !t.completed).length;
  const countImportant = nonTrashed.filter((t) => t.important && !t.completed).length;
  const countOverdue = nonTrashed.filter((t) => isTaskOverdue(t)).length;
  const countCompleted = nonTrashed.filter((t) => t.completed).length;
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const selectedTaskObj = tasks.find((t) => t.id === selectedTaskId) || null;
  const activeTimerTaskObj = tasks.find((t) => t.id === activeTimerTaskId) || null;

  const selectSidebarNav = (view: SidebarView) => {
    setSidebarView(view);
    setActiveProjectFilter(null);
    setActiveTagFilter(null);
    setMobileSidebarOpen(false);
  };

  const navItems: { id: SidebarView; icon: string; label: string; count?: number; alert?: boolean }[] = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'today', icon: '📅', label: 'Today', count: countToday },
    { id: 'upcoming', icon: '📆', label: 'Upcoming', count: countUpcoming },
    { id: 'inbox', icon: '📥', label: 'Inbox', count: countInbox },
    { id: 'important', icon: '⭐', label: 'Important', count: countImportant },
    { id: 'overdue', icon: '⚠️', label: 'Overdue', count: countOverdue, alert: countOverdue > 0 },
    { id: 'completed', icon: '✅', label: 'Completed', count: countCompleted },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
  ];

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
    setProjects((prev) => [
      ...prev,
      {
        id: `proj-${Date.now()}`,
        name: newProjectName.trim(),
        color: colors[prev.length % colors.length],
        icon: '📁',
      },
    ]);
    setNewProjectName('');
    setAddingProject(false);
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newTagName.trim().replace(/^#/, '');
    if (!cleaned) return;
    if (!tagsList.some((t) => t.name.toLowerCase() === cleaned.toLowerCase())) {
      const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6'];
      setTagsList((prev) => [
        ...prev,
        {
          id: `tag-${Date.now()}`,
          name: cleaned,
          color: colors[prev.length % colors.length],
        },
      ]);
    }
    setNewTagName('');
    setAddingTag(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* =====================================================================
          LEFT SIDEBAR
         ===================================================================== */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-68 shrink-0 bg-white dark:bg-slate-900/95 border-r border-slate-200/80 dark:border-slate-800/90 flex flex-col transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-md">
              ✓
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block text-slate-900 dark:text-white">
                TaskFlow Pro
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 block">
                🔥 {goals.streakDays}d Streak · AI Powered
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Quick New Task CTA in Sidebar */}
        <div className="px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={() => setNewTaskModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-between transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">+</span> New Task
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-indigo-700 text-[10px] font-mono">
              N
            </kbd>
          </button>
        </div>

        {/* Main Navigation Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          {/* Primary Views */}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive =
                sidebarView === item.id && !activeProjectFilter && !activeTagFilter;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSidebarNav(item.id)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.alert
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 📁 Projects Section (Supports Drag & Drop onto Project!) */}
          <div>
            <div className="px-3 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                📁 Projects
              </span>
              <button
                type="button"
                onClick={() => setAddingProject((p) => !p)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Add
              </button>
            </div>

            {addingProject && (
              <form onSubmit={handleAddProjectSubmit} className="px-2 mb-2 flex gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white"
                >
                  Add
                </button>
              </form>
            )}

            <div className="space-y-0.5">
              {projects.map((proj) => {
                const count = nonTrashed.filter(
                  (t) => t.category === proj.name && !t.completed
                ).length;
                const isSelected = activeProjectFilter === proj.name;
                const isDragOver = dragOverProject === proj.name;

                return (
                  <button
                    key={proj.id}
                    type="button"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverProject(proj.name);
                    }}
                    onDragLeave={() => setDragOverProject(null)}
                    onDrop={(e) => handleDropOnProjectSidebar(e, proj.name)}
                    onClick={() => {
                      setActiveProjectFilter(proj.name);
                      setActiveTagFilter(null);
                      setSidebarView('inbox');
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold'
                        : isDragOver
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-500'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>{proj.icon}</span>
                      <span className="truncate">{proj.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🏷️ Tags Section */}
          <div>
            <div className="px-3 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                🏷️ Tags
              </span>
              <button
                type="button"
                onClick={() => setAddingTag((t) => !t)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Add
              </button>
            </div>

            {addingTag && (
              <form onSubmit={handleAddTagSubmit} className="px-2 mb-2 flex gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name..."
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white"
                >
                  Add
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-1.5 px-2">
              {tagsList.map((tag) => {
                const isSelected = activeTagFilter === tag.name;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setActiveTagFilter(isSelected ? null : tag.name);
                      setActiveProjectFilter(null);
                      setSidebarView('inbox');
                      setMobileSidebarOpen(false);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isSelected ? '#fff' : tag.color }}
                    />
                    #{tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Archive, Trash, Templates & Profile */}
          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/80 space-y-0.5">
            <button
              type="button"
              onClick={() => selectSidebarNav('profile')}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                sidebarView === 'profile'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span>📋</span> Templates, Share & Export
              </span>
            </button>
            <button
              type="button"
              onClick={() => selectSidebarNav('archive')}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                sidebarView === 'archive'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span>📦</span> Archive
              </span>
              <span className="text-[10px]">
                {tasks.filter((t) => t.archived && !t.trashed).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => selectSidebarNav('trash')}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                sidebarView === 'trash'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span>🗑️</span> Trash
              </span>
              <span className="text-[10px]">{tasks.filter((t) => t.trashed).length}</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Pomodoro Launcher & Command Palette Shortcut */}
        <div className="p-3 border-t border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPomodoroOpen((prev) => !prev)}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500 flex items-center justify-center gap-1.5"
          >
            <span>⏱️</span>
            <span>Pomodoro</span>
          </button>
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="py-2 px-2.5 rounded-xl text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500"
            title="Open Command Palette (Ctrl+K)"
          >
            ⌘K
          </button>
        </div>
      </aside>

      {/* =====================================================================
          MAIN WORKSPACE AREA
         ===================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header Bar */}
        <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Mobile Menu Button + Search Input */}
            <div className="flex items-center gap-2.5 flex-1 max-w-xl">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                aria-label="Open menu"
              >
                ☰
              </button>

              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  🔍
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, search: e.target.value }));
                    if (sidebarView === 'dashboard' && e.target.value.trim()) {
                      setSidebarView('inbox');
                    }
                  }}
                  placeholder="Search tasks, #tags, projects... (Press / or Ctrl+K)"
                  className="w-full pl-8 pr-16 py-2 rounded-xl text-xs bg-slate-100/90 dark:bg-slate-800/90 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-100"
                />
                {filters.search ? (
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, search: '' }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCommandPaletteOpen(true)}
                    className="hidden sm:inline-block absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-600"
                  >
                    Ctrl+K
                  </button>
                )}
              </div>
            </div>

            {/* Right: View Switcher (List / Kanban / Calendar), Undo/Redo, AI, Notifications, Theme Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Display Mode Switcher: List / Kanban / Calendar */}
              <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setDisplayMode('list');
                    if (sidebarView === 'dashboard' || sidebarView === 'analytics' || sidebarView === 'profile') {
                      setSidebarView('inbox');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    displayMode === 'list' && sidebarView !== 'dashboard' && sidebarView !== 'analytics'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  ☰ List
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisplayMode('kanban');
                    if (sidebarView === 'dashboard' || sidebarView === 'analytics' || sidebarView === 'profile') {
                      setSidebarView('inbox');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    displayMode === 'kanban' && sidebarView !== 'dashboard' && sidebarView !== 'analytics'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  📋 Kanban
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisplayMode('calendar');
                    if (sidebarView === 'dashboard' || sidebarView === 'analytics' || sidebarView === 'profile') {
                      setSidebarView('inbox');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    displayMode === 'calendar' && sidebarView !== 'dashboard' && sidebarView !== 'analytics'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  📅 Calendar
                </button>
              </div>

              {/* Undo / Redo Buttons */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={pastHistory.length === 0}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35"
                >
                  ↩️
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={futureHistory.length === 0}
                  title="Redo (Ctrl+Y)"
                  className="p-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35"
                >
                  ↪️
                </button>
              </div>

              {/* AI Assistant Button */}
              <button
                type="button"
                onClick={() => setAiModalOpen(true)}
                title="AI Task Suggestions"
                className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold flex items-center gap-1"
              >
                <span>🤖</span>
                <span className="hidden sm:inline">AI</span>
              </button>

              {/* Notifications Center Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((o) => !o);
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                  }}
                  className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
                  title="Notifications & Reminders"
                >
                  🔔
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-40 space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                          🔔 Notifications & Reminders
                        </span>
                        <button
                          type="button"
                          onClick={() => setNotifications([])}
                          className="text-[11px] text-slate-400 hover:text-rose-500"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1.5">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">
                            No notifications right now.
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (n.taskId) {
                                  setSelectedTaskId(n.taskId);
                                }
                                setNotificationsOpen(false);
                              }}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer text-xs"
                            >
                              <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-100">
                                <span>{n.title}</span>
                                <span className="text-[10px] text-slate-400">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {n.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={() => setDarkMode((d) => !d)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-colors"
                title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode (Shortcut: D)`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Container */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {sidebarView === 'dashboard' ? (
            <DashboardView
              tasks={tasks}
              goals={goals}
              projects={projects}
              collaborators={collaborators}
              tagsList={tagsList}
              activeTimerTaskId={activeTimerTaskId}
              selectedTaskId={selectedTaskId}
              onSelectTask={(t) => setSelectedTaskId(t.id)}
              onToggleComplete={handleToggleComplete}
              onToggleImportant={handleToggleImportant}
              onToggleReminder={handleToggleReminder}
              onToggleSubtask={handleToggleSubtask}
              onStartTimer={handleStartTimer}
              onDuplicate={handleDuplicateTask}
              onSaveAsTemplate={handleSaveAsTemplate}
              onArchive={handleArchiveTask}
              onDelete={handleDeleteTask}
              onQuickCreateTask={handleQuickCreateTask}
              onOpenNewTaskModal={() => setNewTaskModalOpen(true)}
              onOpenAIModal={() => setAiModalOpen(true)}
              onNavigateView={(v) => selectSidebarNav(v)}
            />
          ) : sidebarView === 'analytics' ? (
            <AnalyticsView
              tasks={tasks}
              goals={goals}
              projects={projects}
              onUpdateGoals={setGoals}
            />
          ) : sidebarView === 'profile' ? (
            <ProfileAndToolsView
              tasks={tasks}
              templates={templates}
              collaborators={collaborators}
              goals={goals}
              onApplyTemplate={handleApplyTemplate}
              onDeleteTemplate={(id) =>
                setTemplates((prev) => prev.filter((t) => t.id !== id))
              }
              onAddCollaborator={(name, email, role) => {
                const initials = name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                setCollaborators((prev) => [
                  ...prev,
                  {
                    id: `c-${Date.now()}`,
                    name,
                    email,
                    role,
                    initials: initials || 'TM',
                    color: 'bg-indigo-600',
                  },
                ]);
                showToast('👥 Member Invited', `${name} added to workspace collaborators.`);
              }}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
              onImportTasks={(imported) => {
                commitTasks(() => imported);
                showToast('📂 Tasks Imported', `Loaded ${imported.length} tasks.`);
              }}
              onResetDemoData={() => {
                commitTasks(() => getInitialTasks());
                showToast('↺ Workspace Reset', 'Restored default sample tasks.');
              }}
            />
          ) : (
            /* Tasks View (Today, Upcoming, Inbox, Important, Overdue, Completed, Projects, Tags, Archive, Trash) */
            <div className="space-y-5">
              {/* View Title & Display Mode Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white capitalize">
                      {activeProjectFilter
                        ? `📁 Project: ${activeProjectFilter}`
                        : activeTagFilter
                          ? `🏷️ Tag: #${activeTagFilter}`
                          : sidebarView}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                      {filteredTasks.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Click any task to open the full Details Drawer · Drag cards to reorder or move across columns
                  </p>
                </div>

                {/* Mobile & Desktop Display Mode Switcher + Filter Reset */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('list')}
                      className={`px-2.5 py-1 rounded-lg ${
                        displayMode === 'list'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      ☰ List
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('kanban')}
                      className={`px-2.5 py-1 rounded-lg ${
                        displayMode === 'kanban'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      📋 Kanban
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('calendar')}
                      className={`px-2.5 py-1 rounded-lg ${
                        displayMode === 'calendar'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      📅 Calendar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNewTaskModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    + Add Task
                  </button>
                </div>
              </div>

              {/* 🔍 Advanced Search & Filters Bar */}
              <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-400 px-1">Filters:</span>

                <select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      priority: e.target.value as Priority | 'all',
                    }))
                  }
                  className="rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🔵 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      status: e.target.value as TaskStatus | 'all',
                    }))
                  }
                  className="rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>

                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, category: e.target.value }))
                  }
                  className="rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="all">All Categories</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      sortBy: e.target.value as FilterState['sortBy'],
                    }))
                  }
                  className="rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ml-auto"
                >
                  <option value="order">Sort: Custom Drag Order</option>
                  <option value="priority">Sort: Highest Priority</option>
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="title">Sort: Alphabetical</option>
                </select>

                {(filters.priority !== 'all' ||
                  filters.status !== 'all' ||
                  filters.category !== 'all' ||
                  filters.search ||
                  activeProjectFilter ||
                  activeTagFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({
                        search: '',
                        priority: 'all',
                        status: 'all',
                        category: 'all',
                        tag: 'all',
                        recurrence: 'all',
                        sortBy: 'order',
                      });
                      setActiveProjectFilter(null);
                      setActiveTagFilter(null);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Render Active Display Mode: Kanban, Calendar, or List */}
              {displayMode === 'kanban' ? (
                <KanbanView
                  tasks={filteredTasks}
                  allTasks={tasks}
                  collaborators={collaborators}
                  tagsList={tagsList}
                  activeTimerTaskId={activeTimerTaskId}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={(t) => setSelectedTaskId(t.id)}
                  onToggleComplete={handleToggleComplete}
                  onToggleImportant={handleToggleImportant}
                  onToggleReminder={handleToggleReminder}
                  onToggleSubtask={handleToggleSubtask}
                  onStartTimer={handleStartTimer}
                  onDuplicate={handleDuplicateTask}
                  onSaveAsTemplate={handleSaveAsTemplate}
                  onArchive={handleArchiveTask}
                  onDelete={handleDeleteTask}
                  onMoveTaskStatus={(taskId, newStatus) => {
                    commitTasks((prev) =>
                      prev.map((t) =>
                        t.id === taskId
                          ? {
                              ...t,
                              status: newStatus,
                              completed: newStatus === 'done',
                            }
                          : t
                      )
                    );
                    showToast('📋 Status Updated', `Moved task to ${newStatus.toUpperCase()}`);
                  }}
                  onCreateInColumn={(title, status) => {
                    const newTask: Task = {
                      id: `task-col-${Date.now()}`,
                      title,
                      description: '',
                      status,
                      completed: status === 'done',
                      priority: 'medium',
                      category: activeProjectFilter || 'Work',
                      tags: activeTagFilter ? [activeTagFilter] : [],
                      dueDate: getRelativeDateStr(0),
                      dueTime: '18:00',
                      reminder: false,
                      recurrence: 'none',
                      subtasks: [],
                      dependencies: [],
                      notes: '',
                      attachments: [],
                      timeSpent: 0,
                      estimatedTime: 30,
                      important: false,
                      archived: false,
                      trashed: false,
                      order: 0,
                      assignees: ['c1'],
                      activity: [],
                      createdAt: getRelativeDateStr(0),
                    };
                    commitTasks((prev) => [newTask, ...prev]);
                  }}
                />
              ) : displayMode === 'calendar' ? (
                <CalendarView
                  tasks={filteredTasks}
                  onSelectTask={(t) => setSelectedTaskId(t.id)}
                  onRescheduleTask={(taskId, newDateStr) => {
                    commitTasks((prev) =>
                      prev.map((t) =>
                        t.id === taskId ? { ...t, dueDate: newDateStr } : t
                      )
                    );
                    showToast('📅 Task Rescheduled', `Moved task due date to ${newDateStr}`);
                  }}
                  onCreateOnDate={(title, dateStr, priority) => {
                    handleQuickCreateTask(
                      title,
                      priority,
                      activeProjectFilter || 'Work',
                      dateStr
                    );
                  }}
                  onToggleComplete={handleToggleComplete}
                />
              ) : (
                /* Standard List View with Drag & Drop Reordering */
                <div className="space-y-3 pb-24">
                  {filteredTasks.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
                      <div className="text-3xl">✨</div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        No tasks match this view
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Create a new task, switch filters, or use AI Task Suggestions to plan your next milestone.
                      </p>
                      <button
                        type="button"
                        onClick={() => setNewTaskModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500"
                      >
                        + Create Task
                      </button>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        allTasks={tasks}
                        collaborators={collaborators}
                        tagsList={tagsList}
                        isSelected={selectedTaskId === task.id}
                        activeTimerTaskId={activeTimerTaskId}
                        onSelect={(t) => setSelectedTaskId(t.id)}
                        onToggleComplete={handleToggleComplete}
                        onToggleImportant={handleToggleImportant}
                        onToggleReminder={handleToggleReminder}
                        onToggleSubtask={handleToggleSubtask}
                        onStartTimer={handleStartTimer}
                        onDuplicate={handleDuplicateTask}
                        onSaveAsTemplate={handleSaveAsTemplate}
                        onArchive={handleArchiveTask}
                        onDelete={handleDeleteTask}
                        onRestore={handleRestoreTask}
                        onDragStart={handleCardDragStart}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleCardDropOnCard}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          TASK DETAILS SIDE PANEL
         ===================================================================== */}
      {selectedTaskObj && (
        <TaskDetailsPanel
          task={selectedTaskObj}
          allTasks={tasks}
          projects={projects}
          tagsList={tagsList}
          collaborators={collaborators}
          activeTimerTaskId={activeTimerTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdateTask={handleUpdateTask}
          onAddTag={(tagName) => {
            if (!tagsList.some((t) => t.name.toLowerCase() === tagName.toLowerCase())) {
              setTagsList((prev) => [
                ...prev,
                { id: `t-${Date.now()}`, name: tagName, color: '#6366f1' },
              ]);
            }
          }}
          onStartTimer={handleStartTimer}
          onStopTimer={() => setTimerRunning(false)}
          onArchive={handleArchiveTask}
          onDelete={handleDeleteTask}
          onRestore={handleRestoreTask}
          onSaveAsTemplate={handleSaveAsTemplate}
          onNotify={showToast}
        />
      )}

      {/* =====================================================================
          FLOATING + BUTTON (Instantly Create a Task)
         ===================================================================== */}
      <button
        type="button"
        onClick={() => setNewTaskModalOpen(true)}
        title="Quick Create Task (Shortcut: N)"
        className="fixed bottom-20 md:bottom-7 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/35 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-3xl font-light cursor-pointer"
      >
        +
      </button>

      {/* =====================================================================
          MOBILE BOTTOM NAVIGATION: Dashboard / Tasks / Calendar / Analytics / Profile
         ===================================================================== */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 py-1.5 px-2">
        <button
          type="button"
          onClick={() => selectSidebarNav('dashboard')}
          className={`flex flex-col items-center py-1 rounded-xl text-[11px] font-semibold ${
            sidebarView === 'dashboard'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="text-base">🏠</span>
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => {
            selectSidebarNav('inbox');
            setDisplayMode('list');
          }}
          className={`flex flex-col items-center py-1 rounded-xl text-[11px] font-semibold ${
            sidebarView !== 'dashboard' &&
            sidebarView !== 'analytics' &&
            sidebarView !== 'profile' &&
            displayMode !== 'calendar'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="text-base">☑️</span>
          <span>Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => {
            selectSidebarNav('inbox');
            setDisplayMode('calendar');
          }}
          className={`flex flex-col items-center py-1 rounded-xl text-[11px] font-semibold ${
            displayMode === 'calendar' &&
            sidebarView !== 'dashboard' &&
            sidebarView !== 'analytics' &&
            sidebarView !== 'profile'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="text-base">📅</span>
          <span>Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => selectSidebarNav('analytics')}
          className={`flex flex-col items-center py-1 rounded-xl text-[11px] font-semibold ${
            sidebarView === 'analytics'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="text-base">📊</span>
          <span>Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => selectSidebarNav('profile')}
          className={`flex flex-col items-center py-1 rounded-xl text-[11px] font-semibold ${
            sidebarView === 'profile'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="text-base">👤</span>
          <span>Profile</span>
        </button>
      </nav>

      {/* =====================================================================
          MODALS & FLOATING WIDGETS
         ===================================================================== */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        tasks={tasks}
        templates={templates}
        darkMode={darkMode}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTask={(t) => setSelectedTaskId(t.id)}
        onNavigateSidebar={selectSidebarNav}
        onSetDisplayMode={setDisplayMode}
        onOpenNewTaskModal={() => setNewTaskModalOpen(true)}
        onApplyTemplate={handleApplyTemplate}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onOpenAIModal={() => setAiModalOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExportJSON={handleExportJSON}
      />

      <NewTaskModal
        isOpen={newTaskModalOpen}
        projects={projects}
        tagsList={tagsList}
        templates={templates}
        onClose={() => setNewTaskModalOpen(false)}
        onCreateTask={handleCreateTaskFull}
      />

      <AISuggestionsModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onAddSuggestedTask={(s) =>
          handleCreateTaskFull({
            title: s.title,
            description: s.description,
            priority: s.priority,
            category: s.category,
            tags: s.tags,
            dueDate: getRelativeDateStr(0),
            dueTime: '17:00',
            reminder: true,
            recurrence: 'none',
            subtasks: s.subtasks,
            notes: 'Generated by TaskFlow AI Assistant',
            important: true,
          })
        }
      />

      {pomodoroOpen && (
        <PomodoroWidget
          activeTask={activeTimerTaskObj}
          isRunning={timerRunning}
          mode={timerMode}
          secondsLeft={secondsLeft}
          onToggleRun={() => setTimerRunning((r) => !r)}
          onReset={() => {
            setTimerRunning(false);
            setSecondsLeft(
              timerMode === 'pomodoro'
                ? 25 * 60
                : timerMode === 'short-break'
                  ? 5 * 60
                  : 15 * 60
            );
          }}
          onChangeMode={(m) => {
            setTimerMode(m);
            setTimerRunning(false);
            setSecondsLeft(
              m === 'pomodoro' ? 25 * 60 : m === 'short-break' ? 5 * 60 : 15 * 60
            );
          }}
          onClose={() => setPomodoroOpen(false)}
        />
      )}

      {/* Toast Notification Popover */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-24 z-50 max-w-sm rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 shadow-2xl border border-slate-700 dark:border-slate-200 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-xs font-extrabold">{toast.title}</p>
            <p className="text-[11px] opacity-85 mt-0.5">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
