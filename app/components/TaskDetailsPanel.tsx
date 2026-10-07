'use client';

import React, { useState } from 'react';
import {
  Task,
  Priority,
  TaskStatus,
  RecurrencePattern,
  Project,
  TagItem,
  Collaborator,
} from '../types/todo';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatDuration,
  generateAISubtasks,
} from '../data/initialData';
import {
  IconCheck,
  IconStar,
  IconShare,
  IconX,
  IconBell,
  IconSparkles,
  IconClock,
  IconPlay,
  IconPause,
  IconPaperclip,
  IconArchive,
  IconTrash,
} from './Icons';

interface TaskDetailsPanelProps {
  task: Task | null;
  allTasks: Task[];
  projects: Project[];
  tagsList: TagItem[];
  collaborators: Collaborator[];
  activeTimerTaskId: string | null;
  onClose: () => void;
  onUpdateTask: (updated: Task, logMessage?: string) => void;
  onAddTag: (tagName: string) => void;
  onStartTimer: (task: Task) => void;
  onStopTimer: () => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onRestore: (taskId: string) => void;
  onSaveAsTemplate: (task: Task) => void;
  onNotify: (title: string, message: string) => void;
}

export default function TaskDetailsPanel({
  task,
  allTasks,
  projects,
  tagsList,
  collaborators,
  activeTimerTaskId,
  onClose,
  onUpdateTask,
  onAddTag,
  onStartTimer,
  onStopTimer,
  onArchive,
  onDelete,
  onRestore,
  onSaveAsTemplate,
  onNotify,
}: TaskDetailsPanelProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newComment, setNewComment] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  if (!task) return null;

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const isTimerRunning = activeTimerTaskId === task.id;

  const handleFieldChange = <K extends keyof Task>(
    key: K,
    value: Task[K],
    logMsg?: string
  ) => {
    const nextTask: Task = {
      ...task,
      [key]: value,
    };
    if (key === 'status') {
      nextTask.completed = value === 'done';
    }
    if (key === 'completed') {
      nextTask.status = value ? 'done' : 'todo';
    }
    onUpdateTask(nextTask, logMsg);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const nextSubtasks = [
      ...task.subtasks,
      {
        id: `sub-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ];
    handleFieldChange('subtasks', nextSubtasks, `Added subtask "${newSubtaskTitle.trim()}"`);
    setNewSubtaskTitle('');
  };

  const handleAIBreakdown = () => {
    const suggestions = generateAISubtasks(task.title, task.category);
    const existingTitles = new Set(task.subtasks.map((s) => s.title.toLowerCase()));
    const added = suggestions
      .filter((t) => !existingTitles.has(t.toLowerCase()))
      .map((title, idx) => ({
        id: `ai-sub-${Date.now()}-${idx}`,
        title,
        completed: false,
      }));

    if (added.length === 0) {
      onNotify('AI Breakdown', 'All recommended subtasks are already in your checklist.');
      return;
    }

    handleFieldChange(
      'subtasks',
      [...task.subtasks, ...added],
      `AI generated ${added.length} smart subtasks`
    );
    onNotify('AI Breakdown Complete', `Added ${added.length} actionable subtasks to "${task.title}"`);
  };

  const handleToggleSubtask = (subId: string) => {
    const nextSubtasks = task.subtasks.map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    handleFieldChange('subtasks', nextSubtasks);
  };

  const handleDeleteSubtask = (subId: string) => {
    const nextSubtasks = task.subtasks.filter((s) => s.id !== subId);
    handleFieldChange('subtasks', nextSubtasks);
  };

  const handleToggleTag = (tagName: string) => {
    const exists = task.tags.includes(tagName);
    const nextTags = exists
      ? task.tags.filter((t) => t !== tagName)
      : [...task.tags, tagName];
    handleFieldChange('tags', nextTags);
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newTagInput.trim().replace(/^#/, '');
    if (!cleaned) return;
    onAddTag(cleaned);
    if (!task.tags.includes(cleaned)) {
      handleFieldChange('tags', [...task.tags, cleaned]);
    }
    setNewTagInput('');
  };

  const handleToggleDependency = (depTaskId: string) => {
    const exists = task.dependencies.includes(depTaskId);
    const nextDeps = exists
      ? task.dependencies.filter((id) => id !== depTaskId)
      : [...task.dependencies, depTaskId];
    handleFieldChange('dependencies', nextDeps, 'Updated task dependencies');
  };

  const handleToggleAssignee = (collabId: string) => {
    const exists = task.assignees.includes(collabId);
    const nextAssignees = exists
      ? task.assignees.filter((id) => id !== collabId)
      : [...task.assignees, collabId];
    handleFieldChange('assignees', nextAssignees, 'Updated collaborators');
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentName.trim()) return;
    const nextAttachments = [
      ...task.attachments,
      {
        id: `att-${Date.now()}`,
        name: newAttachmentName.trim(),
        size: '240 KB',
        type: (newAttachmentUrl.trim().startsWith('http') ? 'link' : 'file') as 'link' | 'file',
        url: newAttachmentUrl.trim() || '#',
        addedAt: 'Just now',
      },
    ];
    handleFieldChange(
      'attachments',
      nextAttachments,
      `Attached "${newAttachmentName.trim()}"`
    );
    setNewAttachmentName('');
    setNewAttachmentUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = Math.max(1, Math.round(file.size / 1024));
    const sizeFormatted = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    const nextAttachments = [
      ...task.attachments,
      {
        id: `att-${Date.now()}`,
        name: file.name,
        size: sizeFormatted,
        type: 'file' as const,
        url: '#',
        addedAt: 'Just now',
      },
    ];
    handleFieldChange('attachments', nextAttachments, `Uploaded file "${file.name}"`);
    e.target.value = '';
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const nextActivity = [
      {
        id: `act-${Date.now()}`,
        text: newComment.trim(),
        timestamp: 'Just now',
        user: 'Alex Rivera (You)',
        type: 'comment' as const,
      },
      ...task.activity,
    ];
    onUpdateTask({
      ...task,
      activity: nextActivity,
    });
    setNewComment('');
  };

  const handleAddManualTime = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(manualMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    handleFieldChange(
      'timeSpent',
      task.timeSpent + mins * 60,
      `Logged ${mins}m of focus time`
    );
    setManualMinutes('');
  };

  const handleShareTask = () => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?task=${task.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopiedShare(true);
    onNotify('Link Copied', `Shareable collaboration link for "${task.title}" copied.`);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const otherTasks = allTasks.filter((t) => t.id !== task.id && !t.trashed);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <aside className="relative z-10 w-full max-w-xl pro-surface bg-white dark:bg-[#0b101d] h-full shadow-2xl border-l border-slate-200 dark:border-white/[0.08] flex flex-col overflow-hidden">
        {/* Top Inspector Bar */}
        <div className="px-6 py-4 border-b border-slate-200/70 dark:border-white/[0.07] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handleFieldChange(
                  'completed',
                  !task.completed,
                  task.completed ? 'Reopened task' : 'Completed task'
                )
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                task.completed
                  ? 'bg-emerald-500 text-white'
                  : 'pro-surface hover:border-emerald-500 text-slate-700 dark:text-slate-200'
              }`}
            >
              <IconCheck className="w-3.5 h-3.5" />
              <span>{task.completed ? 'Completed' : 'Mark Complete'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleFieldChange('important', !task.important)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                task.important
                  ? 'bg-amber-400/15 border-amber-400/40 text-amber-400'
                  : 'border-slate-200 dark:border-white/[0.08] text-slate-400 hover:text-amber-400'
              }`}
              title="Toggle Important"
            >
              <IconStar className="w-3.5 h-3.5" filled={task.important} />
            </button>

            <button
              type="button"
              onClick={handleShareTask}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium pro-surface text-slate-600 dark:text-slate-300 hover:border-[var(--accent-primary)] flex items-center gap-1.5 cursor-pointer"
            >
              <IconShare className="w-3.5 h-3.5" />
              <span>{copiedShare ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Close Drawer (Esc)"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Details Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Description */}
          <div className="space-y-3">
            <input
              type="text"
              value={task.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Task title..."
              className="w-full text-lg font-bold bg-transparent border-0 border-b border-transparent focus:border-[var(--accent-primary)] focus:outline-none text-slate-900 dark:text-white pb-1"
            />
            <textarea
              rows={2}
              value={task.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Add a detailed description..."
              className="w-full text-xs bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200/80 dark:border-white/[0.07] focus:border-[var(--accent-primary)] focus:outline-none text-slate-700 dark:text-slate-200 resize-none"
            />
          </div>

          {/* Core Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/80 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) =>
                  handleFieldChange(
                    'status',
                    e.target.value as TaskStatus,
                    `Changed status to ${STATUS_CONFIG[e.target.value as TaskStatus].label}`
                  )
                }
                className="w-full text-xs font-medium rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) =>
                  handleFieldChange(
                    'priority',
                    e.target.value as Priority,
                    `Changed priority to ${PRIORITY_CONFIG[e.target.value as Priority].label}`
                  )
                }
                className="w-full text-xs font-medium rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Category
              </label>
              <select
                value={task.category}
                onChange={(e) =>
                  handleFieldChange('category', e.target.value, `Moved to ${e.target.value}`)
                }
                className="w-full text-xs font-medium rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={task.dueDate}
                onChange={(e) =>
                  handleFieldChange('dueDate', e.target.value, `Rescheduled to ${e.target.value}`)
                }
                className="w-full text-xs font-medium rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Due Time
              </label>
              <input
                type="time"
                value={task.dueTime}
                onChange={(e) => handleFieldChange('dueTime', e.target.value)}
                className="w-full text-xs font-medium rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Recurrence
              </label>
              <select
                value={task.recurrence}
                onChange={(e) =>
                  handleFieldChange(
                    'recurrence',
                    e.target.value as RecurrencePattern,
                    `Set recurrence to ${e.target.value}`
                  )
                }
                className="w-full text-xs font-medium rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Reminder Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <IconBell className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Smart Reminder & Alert
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Notify prior to deadline
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {task.reminder && (
                <input
                  type="time"
                  value={task.reminderTime || '09:00'}
                  onChange={(e) => handleFieldChange('reminderTime', e.target.value)}
                  className="text-xs rounded-lg px-2 py-1 bg-white dark:bg-slate-900 border border-amber-500/30 text-slate-800 dark:text-slate-200"
                />
              )}
              <button
                type="button"
                onClick={() => handleFieldChange('reminder', !task.reminder)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  task.reminder
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {task.reminder ? 'Enabled' : 'Off'}
              </button>
            </div>
          </div>

          {/* Subtasks / Checklist with AI Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subtasks ({completedSubtasks}/{totalSubtasks})
                </h4>
                {totalSubtasks > 0 && (
                  <span className="text-xs font-mono font-semibold pro-text-accent">
                    {subtaskPercent}%
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAIBreakdown}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold pro-btn-accent cursor-pointer"
              >
                <IconSparkles className="w-3.5 h-3.5" />
                <span>AI Auto-Breakdown</span>
              </button>
            </div>

            {totalSubtasks > 0 && (
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${subtaskPercent}%`, background: 'var(--accent-primary)' }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              {task.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] group"
                >
                  <label className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="rounded border-slate-300"
                    />
                    <span className={sub.completed ? 'line-through text-slate-400' : ''}>
                      {sub.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="text-slate-400 hover:text-rose-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a step or checklist item..."
                className="flex-1 text-xs rounded-lg px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg text-xs font-semibold pro-btn-accent"
              >
                + Add
              </button>
            </form>
          </div>

          {/* Time Tracking & Pomodoro */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <IconClock className="w-4 h-4 pro-text-accent" />
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Time Tracking & Pomodoro
                  </h4>
                  <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">
                    {formatDuration(task.timeSpent)}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      / Est. {task.estimatedTime || 30}m
                    </span>
                  </p>
                </div>
              </div>

              {isTimerRunning ? (
                <button
                  type="button"
                  onClick={onStopTimer}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 flex items-center gap-1.5 animate-pulse cursor-pointer"
                >
                  <IconPause className="w-3.5 h-3.5" />
                  <span>Stop Focus</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartTimer(task)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold pro-btn-accent flex items-center gap-1.5 cursor-pointer"
                >
                  <IconPlay className="w-3.5 h-3.5" />
                  <span>Start Focus</span>
                </button>
              )}
            </div>

            <form onSubmit={handleAddManualTime} className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="1"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                placeholder="Log manual minutes (e.g. 25)"
                className="flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-medium pro-surface hover:border-[var(--accent-primary)]"
              >
                + Log Time
              </button>
            </form>
          </div>

          {/* Tags */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {tagsList.map((tag) => {
                const active = task.tags.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.name)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                      active
                        ? 'pro-btn-accent border-transparent'
                        : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: active ? '#fff' : tag.color }}
                    />
                    {tag.name}
                  </button>
                );
              })}
            </div>
            <form onSubmit={handleCreateTag} className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="New custom tag..."
                className="flex-1 text-xs rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-medium pro-surface"
              >
                + Tag
              </button>
            </form>
          </div>

          {/* Task Dependencies */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Task Dependencies (Blocked By)
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06]">
              {otherTasks.map((other) => {
                const isDep = task.dependencies.includes(other.id);
                return (
                  <label
                    key={other.id}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        checked={isDep}
                        onChange={() => handleToggleDependency(other.id)}
                        className="rounded border-slate-300"
                      />
                      <span className="truncate text-slate-700 dark:text-slate-200">
                        {other.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        other.completed
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {other.completed ? 'Done' : 'Pending'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Collaborators */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Collaborators & Assignees
            </h4>
            <div className="flex flex-wrap gap-2">
              {collaborators.map((c) => {
                const assigned = task.assignees.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleToggleAssignee(c.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      assigned
                        ? 'pro-bg-accent-soft border-[var(--accent-primary)]'
                        : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.07] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full ${c.color} text-white text-[10px] font-bold flex items-center justify-center`}
                    >
                      {c.initials}
                    </span>
                    <span>{c.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Notes & Scratchpad
            </h4>
            <textarea
              rows={4}
              value={task.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Write markdown notes, meeting takeaways, code snippets, or links..."
              className="w-full text-xs leading-relaxed bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200/70 dark:border-white/[0.07] focus:border-[var(--accent-primary)] focus:outline-none text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Attachments ({task.attachments.length})
              </h4>
              <label className="cursor-pointer text-xs font-semibold pro-text-accent hover:underline">
                + Upload File
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            {task.attachments.length > 0 && (
              <div className="space-y-1.5">
                {task.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <IconPaperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {att.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {att.size} · {att.addedAt}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleFieldChange(
                          'attachments',
                          task.attachments.filter((a) => a.id !== att.id)
                        )
                      }
                      className="text-slate-400 hover:text-rose-500 ml-2"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddAttachment} className="flex gap-2">
              <input
                type="text"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                placeholder="Attachment title or filename..."
                className="flex-1 text-xs rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07]"
              />
              <input
                type="text"
                value={newAttachmentUrl}
                onChange={(e) => setNewAttachmentUrl(e.target.value)}
                placeholder="Optional URL..."
                className="w-28 text-xs rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-medium pro-surface"
              >
                Attach
              </button>
            </form>
          </div>

          {/* Activity History */}
          <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-white/[0.07]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Activity History & Comments
            </h4>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post a comment or status update..."
                className="flex-1 text-xs rounded-lg px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07]"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg text-xs font-semibold pro-btn-accent"
              >
                Post
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {task.activity.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
              ) : (
                task.activity.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-lg text-xs ${
                      item.type === 'comment'
                        ? 'pro-bg-accent-soft border border-white/10'
                        : 'bg-slate-50 dark:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.user}
                      </span>
                      <span>{item.timestamp}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{item.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200/70 dark:border-white/[0.07] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSaveAsTemplate(task)}
            className="px-3 py-2 rounded-lg text-xs font-medium pro-surface text-slate-700 dark:text-slate-200 hover:border-[var(--accent-primary)] flex items-center gap-1.5 cursor-pointer"
          >
            <IconStar className="w-3.5 h-3.5" />
            <span>Save as Template</span>
          </button>

          <div className="flex items-center gap-2">
            {task.trashed ? (
              <button
                type="button"
                onClick={() => {
                  onRestore(task.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 cursor-pointer"
              >
                Restore
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onArchive(task.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-lg text-xs font-medium pro-surface text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <IconArchive className="w-3.5 h-3.5" />
                <span>{task.archived ? 'Unarchive' : 'Archive'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <IconTrash className="w-3.5 h-3.5" />
              <span>{task.trashed ? 'Delete Forever' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

