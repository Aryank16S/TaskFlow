'use client';

import React, { useState } from 'react';
import { Task, Priority } from '../types/todo';
import { PRIORITY_CONFIG, getRelativeDateStr } from '../data/initialData';
import { IconCalendar } from './Icons';

interface CalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onRescheduleTask: (taskId: string, newDateStr: string) => void;
  onCreateOnDate: (title: string, dateStr: string, priority: Priority) => void;
  onToggleComplete: (taskId: string) => void;
}

export default function CalendarView({
  tasks,
  onSelectTask,
  onRescheduleTask,
  onCreateOnDate,
  onToggleComplete,
}: CalendarViewProps) {
  const todayStr = getRelativeDateStr(0);
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthName = currentMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevDate = new Date(year, month - 1, d);
    const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(prevDate.getDate()).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(
      2,
      '0'
    )}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  const totalCells = calendarCells.length > 35 ? 42 : 35;
  const remaining = totalCells - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(nextDate.getDate()).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDropOnDate = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onRescheduleTask(taskId, dateStr);
    }
    setDragOverDate(null);
  };

  const handleAddOnSelectedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onCreateOnDate(quickTitle.trim(), selectedDate, quickPriority);
    setQuickTitle('');
  };

  const selectedDateTasks = tasks.filter((t) => t.dueDate === selectedDate);
  const pendingBacklog = tasks.filter((t) => !t.completed);

  return (
    <div className="space-y-5 pb-20">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pro-surface p-4 rounded-xl">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg pro-bg-accent-soft flex items-center justify-center">
            <IconCalendar className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {monthName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag any task onto a calendar date cell to reschedule its deadline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold pro-surface hover:border-[var(--accent-primary)]"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDate(todayStr);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold pro-btn-accent"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold pro-surface hover:border-[var(--accent-primary)]"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 items-start">
        {/* Main Calendar Grid */}
        <div className="xl:col-span-3 pro-surface rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200/70 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarCells.map((cell) => {
              const dayTasks = tasks.filter((t) => t.dueDate === cell.dateStr);
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;
              const isDragOver = dragOverDate === cell.dateStr;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverDate(cell.dateStr);
                  }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={(e) => handleDropOnDate(e, cell.dateStr)}
                  className={`min-h-[112px] p-2 border-b border-r border-slate-200/50 dark:border-white/[0.05] transition-all cursor-pointer flex flex-col ${
                    !cell.isCurrentMonth ? 'opacity-40' : ''
                  } ${
                    isSelected
                      ? 'ring-2 ring-inset ring-[var(--accent-primary)] pro-bg-accent-soft'
                      : ''
                  } ${
                    isDragOver
                      ? 'ring-2 ring-[var(--accent-primary)] pro-bg-accent-soft'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isToday
                          ? 'pro-btn-accent'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono font-semibold text-slate-400">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1 overflow-y-auto max-h-24">
                    {dayTasks.map((t) => {
                      const pMeta = PRIORITY_CONFIG[t.priority];
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(t);
                          }}
                          title={`${t.title} (${pMeta.label})`}
                          className={`px-1.5 py-1 rounded text-[11px] font-medium truncate border-l-2 cursor-grab active:cursor-grabbing transition-all ${
                            pMeta.borderLeft
                          } ${
                            t.completed
                              ? 'line-through opacity-50 bg-slate-100 dark:bg-slate-800'
                              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 hover:border-[var(--accent-primary)]'
                          }`}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Selected Date Agenda + Backlog */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl pro-surface space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Agenda · {selectedDate === todayStr ? 'Today' : selectedDate}
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md pro-bg-accent-soft font-semibold">
                {selectedDateTasks.length}
              </span>
            </div>

            <form onSubmit={handleAddOnSelectedDate} className="space-y-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder={`+ Schedule on ${selectedDate}...`}
                className="w-full text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.06] focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={quickPriority}
                  onChange={(e) => setQuickPriority(e.target.value as Priority)}
                  className="text-xs rounded-lg px-2 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.06]"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold pro-btn-accent"
                >
                  Add Task
                </button>
              </div>
            </form>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pt-1">
              {selectedDateTasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No tasks scheduled. Drag any task onto this date cell!
                </p>
              ) : (
                selectedDateTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    onClick={() => onSelectTask(t)}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => onToggleComplete(t.id)}
                        className="rounded border-slate-300"
                      />
                      <div className="truncate">
                        <p
                          className={`text-xs font-semibold truncate ${
                            t.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {t.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {t.category} · {t.dueTime || 'All day'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl pro-surface space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Draggable Task Backlog
            </h3>
            <p className="text-[11px] text-slate-400">
              Drag any pending task below onto a calendar day:
            </p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {pendingBacklog.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  onClick={() => onSelectTask(t)}
                  className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-xs font-medium flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing hover:border-[var(--accent-primary)]"
                >
                  <span className="truncate">{t.title}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {t.dueDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

