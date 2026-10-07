'use client';

import React, { useState, useEffect } from 'react';
import {
  Task,
  TaskTemplate,
  Priority,
  RecurrencePattern,
  Project,
  TagItem,
  SidebarView,
  DisplayMode,
} from '../types/todo';
import { getRelativeDateStr, formatDuration } from '../data/initialData';

/* ============================================================================
   1. COMMAND PALETTE MODAL (Ctrl + K)
   ============================================================================ */
interface CommandPaletteModalProps {
  isOpen: boolean;
  tasks: Task[];
  templates: TaskTemplate[];
  darkMode: boolean;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
  onNavigateSidebar: (view: SidebarView) => void;
  onSetDisplayMode: (mode: DisplayMode) => void;
  onOpenNewTaskModal: () => void;
  onApplyTemplate: (tpl: TaskTemplate) => void;
  onToggleDarkMode: () => void;
  onOpenAIModal: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportJSON: () => void;
}

export function CommandPaletteModal({
  isOpen,
  tasks,
  templates,
  darkMode,
  onClose,
  onSelectTask,
  onNavigateSidebar,
  onSetDisplayMode,
  onOpenNewTaskModal,
  onApplyTemplate,
  onToggleDarkMode,
  onOpenAIModal,
  onUndo,
  onRedo,
  onExportJSON,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const quickActions = [
    {
      id: 'act-new',
      icon: '➕',
      label: 'Create New Task',
      shortcut: 'N',
      run: () => {
        onClose();
        onOpenNewTaskModal();
      },
    },
    {
      id: 'act-ai',
      icon: '🤖',
      label: 'AI Smart Task Suggestions & Breakdown',
      shortcut: 'AI',
      run: () => {
        onClose();
        onOpenAIModal();
      },
    },
    {
      id: 'act-dash',
      icon: '🏠',
      label: 'Go to Dashboard',
      shortcut: '1',
      run: () => {
        onNavigateSidebar('dashboard');
        onClose();
      },
    },
    {
      id: 'act-kanban',
      icon: '📋',
      label: 'Switch to Kanban Board View',
      shortcut: '2',
      run: () => {
        onNavigateSidebar('inbox');
        onSetDisplayMode('kanban');
        onClose();
      },
    },
    {
      id: 'act-cal',
      icon: '📅',
      label: 'Switch to Calendar Drag-and-Drop View',
      shortcut: '3',
      run: () => {
        onNavigateSidebar('inbox');
        onSetDisplayMode('calendar');
        onClose();
      },
    },
    {
      id: 'act-analytics',
      icon: '📊',
      label: 'Open Productivity Analytics',
      shortcut: '4',
      run: () => {
        onNavigateSidebar('analytics');
        onClose();
      },
    },
    {
      id: 'act-theme',
      icon: darkMode ? '☀️' : '🌙',
      label: `Switch to ${darkMode ? 'Light' : 'Dark'} Mode`,
      shortcut: 'D',
      run: () => {
        onToggleDarkMode();
        onClose();
      },
    },
    {
      id: 'act-undo',
      icon: '↩️',
      label: 'Undo Last Action',
      shortcut: 'Ctrl+Z',
      run: () => {
        onUndo();
        onClose();
      },
    },
    {
      id: 'act-redo',
      icon: '↪️',
      label: 'Redo Action',
      shortcut: 'Ctrl+Y',
      run: () => {
        onRedo();
        onClose();
      },
    },
    {
      id: 'act-export',
      icon: '📤',
      label: 'Export All Tasks to JSON',
      shortcut: 'Export',
      run: () => {
        onExportJSON();
        onClose();
      },
    },
  ].filter((a) => !q || a.label.toLowerCase().includes(q));

  const matchingTasks = tasks
    .filter(
      (t) =>
        !t.trashed &&
        (t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)))
    )
    .slice(0, 5);

  const matchingTemplates = templates.filter(
    (tpl) => !q || tpl.name.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 text-lg">🔍</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search tasks, tags, templates... (Esc to close)"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div>
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ⚡ Quick Commands
              </p>
              <div className="space-y-1">
                {quickActions.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={act.run}
                    className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>{act.icon}</span>
                      <span>{act.label}</span>
                    </span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-400">
                      {act.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Templates */}
          {matchingTemplates.length > 0 && (
            <div>
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                📋 Instant Task Templates
              </p>
              <div className="space-y-1">
                {matchingTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      onApplyTemplate(tpl);
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span>{tpl.icon}</span>
                      <span className="font-medium">{tpl.name}</span>
                    </span>
                    <span className="text-[10px] text-indigo-500 font-semibold">
                      + Use Template
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Tasks */}
          {matchingTasks.length > 0 && (
            <div>
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                📌 Jump to Task
              </p>
              <div className="space-y-1">
                {matchingTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onSelectTask(t);
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="truncate font-medium">{t.title}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {t.category} · {t.dueDate}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   2. NEW TASK & TEMPLATES MODAL
   ============================================================================ */
interface NewTaskModalProps {
  isOpen: boolean;
  projects: Project[];
  tagsList: TagItem[];
  templates: TaskTemplate[];
  onClose: () => void;
  onCreateTask: (taskData: {
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
  }) => void;
}

export function NewTaskModal({
  isOpen,
  projects,
  tagsList,
  templates,
  onClose,
  onCreateTask,
}: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [category, setCategory] = useState<string>(projects[0]?.name || 'Work');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(getRelativeDateStr(0));
  const [dueTime, setDueTime] = useState('18:00');
  const [reminder, setReminder] = useState(true);
  const [recurrence, setRecurrence] = useState<RecurrencePattern>('none');
  const [subtaskText, setSubtaskText] = useState('');
  const [notes, setNotes] = useState('');
  const [important, setImportant] = useState(false);

  if (!isOpen) return null;

  const handleLoadTemplate = (tpl: TaskTemplate) => {
    setTitle(tpl.name);
    setDescription(tpl.description);
    setPriority(tpl.priority);
    setCategory(tpl.category);
    setSelectedTags(tpl.tags);
    setRecurrence(tpl.recurrence);
    setSubtaskText(tpl.subtasks.join('\n'));
    setNotes(tpl.notes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const subtasks = subtaskText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      tags: selectedTags,
      dueDate,
      dueTime,
      reminder,
      recurrence,
      subtasks,
      notes,
      important,
    });

    setTitle('');
    setDescription('');
    setSubtaskText('');
    setNotes('');
    setSelectedTags([]);
    onClose();
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>✨</span> Create New Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Templates Quick Loader */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              📋 Or Load from a Task Template
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleLoadTemplate(tpl)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 hover:bg-indigo-100 shrink-0 flex items-center gap-1.5"
                >
                  <span>{tpl.icon}</span>
                  <span>{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name (e.g., Prepare Q4 Product Roadmap)"
              className="w-full text-base font-bold px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
            />

            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description & context..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Grid of Properties */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full text-xs rounded-xl px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Category / Project
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs rounded-xl px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs rounded-xl px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full text-xs rounded-xl px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                🔄 Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrencePattern)}
                className="w-full text-xs rounded-xl px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-4">
              <input
                type="checkbox"
                checked={reminder}
                onChange={(e) => setReminder(e.target.checked)}
                className="rounded text-indigo-600"
              />
              🔔 Enable Reminder Alert
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-4">
              <input
                type="checkbox"
                checked={important}
                onChange={(e) => setImportant(e.target.checked)}
                className="rounded text-yellow-500"
              />
              ⭐ Mark as Important
            </label>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              🏷️ Select Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tagsList.map((t) => {
                const active = selectedTags.includes(t.name);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    #{t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks (1 per line) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ☑️ Subtasks / Checklist (one per line)
            </label>
            <textarea
              rows={3}
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
              placeholder={"Draft initial outline\nReview with team\nFinalize deliverable"}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
   3. AI TASK SUGGESTIONS MODAL
   ============================================================================ */
interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuggestedTask: (suggestion: {
    title: string;
    description: string;
    priority: Priority;
    category: string;
    tags: string[];
    subtasks: string[];
  }) => void;
}

const AI_RECOMMENDATIONS = [
  {
    title: 'Conduct 25-Min Deep Work Sprint on Top Bottleneck',
    description: 'Eliminate context switching and clear your highest priority blocker first.',
    priority: 'urgent' as Priority,
    category: 'Work',
    tags: ['Deep Work', 'Urgent'],
    subtasks: [
      'Put phone on Do Not Disturb for 25 minutes',
      'Complete core implementation step',
      'Push commit and update status to Review',
    ],
  },
  {
    title: 'Spaced Repetition & Active Recall Review Session',
    description: 'Consolidate today’s study material into long-term memory.',
    priority: 'high' as Priority,
    category: 'Study',
    tags: ['Exam Prep', 'Research'],
    subtasks: [
      'Test yourself on 15 key concepts without looking at notes',
      'Write down 3 questions that need deeper clarification',
      'Schedule next review in 48 hours',
    ],
  },
  {
    title: 'Inbox Zero & Tomorrow’s Top 3 Priorities',
    description: 'End-of-day wrap-up ritual so you start tomorrow with 100% clarity.',
    priority: 'medium' as Priority,
    category: 'Personal',
    tags: ['Errands'],
    subtasks: [
      'Archive completed tasks from today',
      'Reschedule any unfinished tasks to realistic slots',
      'Star Top 3 Important tasks for tomorrow morning',
    ],
  },
];

export function AISuggestionsModal({
  isOpen,
  onClose,
  onAddSuggestedTask,
}: AISuggestionsModalProps) {
  const [customGoalPrompt, setCustomGoalPrompt] = useState('');

  if (!isOpen) return null;

  const handleGenerateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoalPrompt.trim()) return;
    const goal = customGoalPrompt.trim();
    onAddSuggestedTask({
      title: `AI Action Plan: ${goal}`,
      description: `Structured execution plan generated by AI for "${goal}"`,
      priority: 'high',
      category: 'Work',
      tags: ['Deep Work', 'Research'],
      subtasks: [
        `Define measurable outcome for ${goal}`,
        'Break down into first 25-minute deliverable',
        'Execute core milestone & review quality',
        'Finalize and document results',
      ],
    });
    setCustomGoalPrompt('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <span>🤖</span> AI Smart Task Assistant
            </h2>
            <p className="text-xs text-indigo-100 mt-0.5">
              Generate structured tasks with pre-built checklists or pick a smart recommendation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Custom AI Prompt Generator */}
          <form onSubmit={handleGenerateCustom} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              ✨ Ask AI to build a task & checklist for any goal:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customGoalPrompt}
                onChange={(e) => setCustomGoalPrompt(e.target.value)}
                placeholder="e.g., Prepare system design interview or Build REST API..."
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shrink-0"
              >
                Generate Task
              </button>
            </div>
          </form>

          {/* Curated AI Suggestions */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recommended Next Actions
            </p>
            {AI_RECOMMENDATIONS.map((rec, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {rec.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onAddSuggestedTask(rec);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shrink-0"
                  >
                    + Add
                  </button>
                </div>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pl-4 list-disc">
                  {rec.subtasks.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   4. POMODORO & FOCUS TIMER FLOATING WIDGET
   ============================================================================ */
interface PomodoroWidgetProps {
  activeTask: Task | null;
  isRunning: boolean;
  mode: 'pomodoro' | 'short-break' | 'long-break';
  secondsLeft: number;
  onToggleRun: () => void;
  onReset: () => void;
  onChangeMode: (mode: 'pomodoro' | 'short-break' | 'long-break') => void;
  onClose: () => void;
}

export function PomodoroWidget({
  activeTask,
  isRunning,
  mode,
  secondsLeft,
  onToggleRun,
  onReset,
  onChangeMode,
  onClose,
}: PomodoroWidgetProps) {
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-72 z-40 w-80 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">⏱️</span>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Pomodoro Focus Timer
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl text-[11px] font-medium">
        <button
          type="button"
          onClick={() => onChangeMode('pomodoro')}
          className={`py-1 rounded-lg transition-colors ${
            mode === 'pomodoro' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Focus 25m
        </button>
        <button
          type="button"
          onClick={() => onChangeMode('short-break')}
          className={`py-1 rounded-lg transition-colors ${
            mode === 'short-break'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Break 5m
        </button>
        <button
          type="button"
          onClick={() => onChangeMode('long-break')}
          className={`py-1 rounded-lg transition-colors ${
            mode === 'long-break' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Long 15m
        </button>
      </div>

      {/* Active Task Info */}
      {activeTask && (
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 text-xs truncate">
          <span className="text-slate-400">Task: </span>
          <span className="font-semibold text-white">{activeTask.title}</span>
          <span className="text-[10px] text-indigo-300 ml-1.5">
            ({formatDuration(activeTask.timeSpent)})
          </span>
        </div>
      )}

      {/* Timer Readout & Controls */}
      <div className="flex items-center justify-between">
        <div className="text-3xl font-mono font-black tracking-tight text-white">
          {mins}:{secs}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleRun}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              isRunning
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
}
