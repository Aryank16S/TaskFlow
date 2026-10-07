'use client';

import React, { useState } from 'react';
import {
  Task,
  Collaborator,
  TagItem,
} from '../types/todo';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatReadableDate,
  isTaskOverdue,
  formatDuration,
} from '../data/initialData';
import {
  IconBell,
  IconStar,
  IconMoreVertical,
  IconCalendar,
  IconCheckSquare,
  IconRepeat,
  IconLink,
  IconClock,
  IconPaperclip,
  IconGripVertical,
  IconLock,
  IconCheck,
  IconArchive,
  IconTrash,
  IconPlay,
  IconLayers,
} from './Icons';

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  collaborators: Collaborator[];
  tagsList: TagItem[];
  isSelected?: boolean;
  activeTimerTaskId?: string | null;
  onSelect: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onToggleImportant: (taskId: string) => void;
  onToggleReminder: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onStartTimer: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onSaveAsTemplate: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onRestore?: (taskId: string) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, targetTask: Task) => void;
  compact?: boolean;
}

export default function TaskCard({
  task,
  allTasks,
  collaborators,
  tagsList,
  isSelected = false,
  activeTimerTaskId = null,
  onSelect,
  onToggleComplete,
  onToggleImportant,
  onToggleReminder,
  onToggleSubtask,
  onStartTimer,
  onDuplicate,
  onSaveAsTemplate,
  onArchive,
  onDelete,
  onRestore,
  onDragStart,
  onDragOver,
  onDrop,
  compact = false,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);

  const priorityMeta = PRIORITY_CONFIG[task.priority];
  const statusMeta = STATUS_CONFIG[task.status];
  const overdue = isTaskOverdue(task);
  const readableDue = formatReadableDate(task.dueDate, task.dueTime);

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const blockingTasks = task.dependencies
    .map((depId) => allTasks.find((t) => t.id === depId))
    .filter((t): t is Task => Boolean(t && !t.completed));
  const isBlocked = blockingTasks.length > 0;

  const assignedUsers = collaborators.filter((c) => task.assignees.includes(c.id));
  const isTimerRunning = activeTimerTaskId === task.id;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragOver={(e) => {
        if (onDragOver) {
          e.preventDefault();
          onDragOver(e, task);
        }
      }}
      onDrop={(e) => {
        if (onDrop) {
          e.preventDefault();
          onDrop(e, task);
        }
      }}
      onClick={() => onSelect(task)}
      className={`group relative rounded-xl pro-surface pro-surface-interactive border-l-[3px] cursor-pointer select-none ${
        priorityMeta.borderLeft
      } ${
        isSelected
          ? 'ring-2 ring-[var(--accent-primary)] bg-[var(--accent-soft)]'
          : ''
      } ${task.completed ? 'opacity-65' : ''} ${compact ? 'p-3' : 'px-4 py-3.5'}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle + Custom Precision Checkbox */}
        <div className="flex items-center gap-1 pt-0.5">
          <span
            title="Drag to reorder or move"
            className="text-slate-400/50 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <IconGripVertical className="w-3.5 h-3.5" />
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id);
            }}
            title={
              isBlocked
                ? `Blocked by: ${blockingTasks.map((b) => b.title).join(', ')}`
                : task.completed
                  ? 'Mark as incomplete'
                  : 'Complete task'
            }
            className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center border transition-all duration-150 ${
              task.completed
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                : isBlocked
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-500'
                  : 'border-slate-300 dark:border-slate-600 hover:border-[var(--accent-primary)] bg-white/80 dark:bg-slate-900/80'
            }`}
          >
            {task.completed ? (
              <IconCheck className="w-3 h-3" />
            ) : isBlocked ? (
              <IconLock className="w-2.5 h-2.5" />
            ) : null}
          </button>
        </div>

        {/* Main Content Column */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Title + Quick Action Icons */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`font-semibold text-[14px] leading-snug tracking-tight transition-colors ${
                    task.completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-primary)]'
                  }`}
                >
                  {task.title}
                </h3>
                {isTimerRunning && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse">
                    <IconClock className="w-3 h-3" /> Live Focus
                  </span>
                )}
              </div>

              {/* Required Subtitle line: High Priority · Work · Today 6:00 PM */}
              <p className="mt-0.5 text-[12px] font-medium text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-1.5">
                <span className={`font-semibold ${priorityMeta.textColor}`}>
                  {priorityMeta.label}
                </span>
                <span className="opacity-40">·</span>
                <span className="text-slate-700 dark:text-slate-300">{task.category}</span>
                <span className="opacity-40">·</span>
                <span
                  className={
                    overdue
                      ? 'text-rose-500 font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
                  }
                >
                  {overdue ? `Overdue · ${readableDue}` : readableDue}
                </span>
              </p>
            </div>

            {/* Action Icons: Reminder, Important Star, More ⋮ Menu */}
            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onToggleReminder(task.id)}
                title={
                  task.reminder
                    ? `Reminder active${task.reminderTime ? ` (${task.reminderTime})` : ''}`
                    : 'Enable reminder'
                }
                className={`p-1.5 rounded-lg transition-colors ${
                  task.reminder
                    ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-60 group-hover:opacity-100'
                }`}
              >
                <IconBell className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onToggleImportant(task.id)}
                title={task.important ? 'Remove from Important' : 'Mark as Important'}
                className={`p-1.5 rounded-lg transition-colors ${
                  task.important
                    ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-60 group-hover:opacity-100'
                }`}
              >
                <IconStar className="w-3.5 h-3.5" filled={task.important} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  title="Task options"
                >
                  <IconMoreVertical className="w-3.5 h-3.5" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-48 rounded-xl pro-surface bg-white dark:bg-[#0f1626] border border-slate-200 dark:border-slate-800 shadow-2xl py-1.5 z-40 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onSelect(task);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                      >
                        <IconLayers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Inspect Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onStartTimer(task);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 pro-text-accent font-medium"
                      >
                        <IconPlay className="w-3.5 h-3.5" />
                        <span>Start Focus Session</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDuplicate(task);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                      >
                        <IconCheckSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duplicate Task</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onSaveAsTemplate(task);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                      >
                        <IconStar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Save as Template</span>
                      </button>
                      <div className="my-1 border-t border-slate-200/70 dark:border-slate-800" />
                      {task.trashed && onRestore ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onRestore(task.id);
                          }}
                          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-emerald-500/10 text-emerald-500"
                        >
                          <IconCheck className="w-3.5 h-3.5" />
                          <span>Restore Task</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onArchive(task.id);
                          }}
                          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                        >
                          <IconArchive className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.archived ? 'Unarchive' : 'Archive Task'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(task.id);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-rose-500/10 text-rose-500"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                        <span>{task.trashed ? 'Delete Permanently' : 'Move to Trash'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Subtle Metadata Pills Bar */}
          <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
            {/* Priority Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${priorityMeta.badgeBg} ${priorityMeta.textColor}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dotColor}`} />
              {priorityMeta.label}
            </span>

            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${statusMeta.bg} ${statusMeta.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>

            {/* Due Date Pill */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                overdue
                  ? 'bg-rose-500/12 text-rose-500 border border-rose-500/25'
                  : 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300'
              }`}
            >
              <IconCalendar className="w-3 h-3 opacity-75" />
              <span>{readableDue}</span>
            </span>

            {/* Subtask Progress 3/5 */}
            {totalSubtasks > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSubtasks((prev) => !prev);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium pro-bg-accent-soft hover:opacity-90 transition-opacity"
                title="Toggle inline subtasks"
              >
                <IconCheckSquare className="w-3 h-3" />
                <span className="font-mono font-semibold">
                  {completedSubtasks}/{totalSubtasks}
                </span>
                <span className="w-9 h-1 bg-slate-300/60 dark:bg-slate-700 rounded-full overflow-hidden">
                  <span
                    className="block h-full bg-[var(--accent-primary)] transition-all duration-300"
                    style={{ width: `${subtaskPercent}%` }}
                  />
                </span>
              </button>
            )}

            {/* Recurrence */}
            {task.recurrence !== 'none' && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/10 text-purple-500 dark:text-purple-400"
                title={`Repeats ${task.recurrence}`}
              >
                <IconRepeat className="w-3 h-3" />
                <span className="capitalize">{task.recurrence}</span>
              </span>
            )}

            {/* Dependencies */}
            {task.dependencies.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                  isBlocked
                    ? 'bg-amber-500/12 text-amber-500 border border-amber-500/25'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}
                title={
                  isBlocked
                    ? `Blocked by: ${blockingTasks.map((b) => b.title).join(', ')}`
                    : 'Dependencies complete'
                }
              >
                <IconLink className="w-3 h-3" />
                <span>{isBlocked ? `Blocked (${blockingTasks.length})` : 'Unblocked'}</span>
              </span>
            )}

            {/* Time Spent */}
            {task.timeSpent > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onStartTimer(task);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-[var(--accent-primary)]"
              >
                <IconClock className="w-3 h-3 opacity-75" />
                <span className="font-mono">{formatDuration(task.timeSpent)}</span>
              </span>
            )}

            {/* Attachments */}
            {task.attachments.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                <IconPaperclip className="w-3 h-3" />
                <span>{task.attachments.length}</span>
              </span>
            )}

            {/* Tags */}
            {task.tags.map((tagName) => {
              const tagObj = tagsList.find((t) => t.name === tagName);
              const color = tagObj?.color || '#6366f1';
              return (
                <span
                  key={tagName}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/[0.04]"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {tagName}
                </span>
              );
            })}

            {/* Assignees */}
            {assignedUsers.length > 0 && (
              <div className="ml-auto flex -space-x-1.5 items-center">
                {assignedUsers.map((u) => (
                  <span
                    key={u.id}
                    title={`${u.name} (${u.role})`}
                    className={`w-5 h-5 rounded-full ${u.color} text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0d121f]`}
                  >
                    {u.initials}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Expandable Inline Subtask Checklist */}
          {showSubtasks && totalSubtasks > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-white/[0.06] space-y-1.5"
            >
              {task.subtasks.map((sub) => (
                <label
                  key={sub.id}
                  className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-[var(--accent-primary)]"
                >
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => onToggleSubtask(task.id, sub.id)}
                    className="rounded border-slate-300 dark:border-slate-600 text-indigo-600"
                  />
                  <span className={sub.completed ? 'line-through text-slate-400' : ''}>
                    {sub.title}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

