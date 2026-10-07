'use client';

import React, { useState } from 'react';
import {
  Task,
  AppGoals,
  Collaborator,
  TagItem,
  Priority,
  Project,
} from '../types/todo';
import {
  isTaskToday,
  isTaskOverdue,
  isTaskUpcoming,
  formatDuration,
  getRelativeDateStr,
} from '../data/initialData';
import TaskCard from './TaskCard';
import {
  IconCalendar,
  IconClock,
  IconAlert,
  IconCheckCircle,
  IconFlame,
  IconSparkles,
  IconPlus,
  IconChart,
  IconTarget,
} from './Icons';

interface DashboardViewProps {
  tasks: Task[];
  goals: AppGoals;
  projects: Project[];
  collaborators: Collaborator[];
  tagsList: TagItem[];
  activeTimerTaskId: string | null;
  selectedTaskId?: string | null;
  onSelectTask: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onToggleImportant: (taskId: string) => void;
  onToggleReminder: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onStartTimer: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onSaveAsTemplate: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onQuickCreateTask: (
    title: string,
    priority: Priority,
    category: string,
    dueDate: string
  ) => void;
  onOpenNewTaskModal: () => void;
  onOpenAIModal: () => void;
  onNavigateView: (view: 'today' | 'upcoming' | 'overdue' | 'analytics') => void;
}

export default function DashboardView({
  tasks,
  goals,
  projects,
  collaborators,
  tagsList,
  activeTimerTaskId,
  selectedTaskId,
  onSelectTask,
  onToggleComplete,
  onToggleImportant,
  onToggleReminder,
  onToggleSubtask,
  onStartTimer,
  onDuplicate,
  onSaveAsTemplate,
  onArchive,
  onDelete,
  onQuickCreateTask,
  onOpenNewTaskModal,
  onOpenAIModal,
  onNavigateView,
}: DashboardViewProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('high');
  const [quickCategory, setQuickCategory] = useState<string>('Work');

  const activeTasks = tasks.filter((t) => !t.archived && !t.trashed);
  const completedTasks = activeTasks.filter((t) => t.completed);
  const todayTasks = activeTasks.filter((t) => isTaskToday(t));
  const todayPending = todayTasks.filter((t) => !t.completed);
  const todayDoneCount = todayTasks.filter((t) => t.completed).length;
  const overdueTasks = activeTasks.filter((t) => isTaskOverdue(t));
  const upcomingTasks = activeTasks.filter((t) => isTaskUpcoming(t));

  const completionPercentage =
    activeTasks.length > 0
      ? Math.round((completedTasks.length / activeTasks.length) * 100)
      : 0;

  const totalFocusSeconds = activeTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const dailyGoalPercent = Math.min(
    100,
    Math.round((todayDoneCount / Math.max(1, goals.dailyTasksGoal)) * 100)
  );
  const weeklyGoalPercent = Math.min(
    100,
    Math.round((completedTasks.length / Math.max(1, goals.weeklyTasksGoal)) * 100)
  );

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyChartData = [
    { day: daysOfWeek[0], completed: 4, target: goals.dailyTasksGoal },
    { day: daysOfWeek[1], completed: 6, target: goals.dailyTasksGoal },
    { day: daysOfWeek[2], completed: 5, target: goals.dailyTasksGoal },
    { day: daysOfWeek[3], completed: 7, target: goals.dailyTasksGoal },
    { day: daysOfWeek[4], completed: 5, target: goals.dailyTasksGoal },
    { day: daysOfWeek[5], completed: 3, target: goals.dailyTasksGoal },
    {
      day: 'Today',
      completed: Math.max(2, todayDoneCount),
      target: goals.dailyTasksGoal,
      isToday: true,
    },
  ];
  const maxBar = Math.max(8, ...weeklyChartData.map((d) => d.completed));

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickCreateTask(
      quickTitle.trim(),
      quickPriority,
      quickCategory,
      getRelativeDateStr(0)
    );
    setQuickTitle('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Executive All-in-One Command Header */}
      <div className="relative overflow-hidden rounded-2xl pro-surface p-6 sm:p-7">
        {/* Subtle ambient accent glow inside header */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{ background: 'var(--accent-primary)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full pro-bg-accent-soft text-xs font-semibold">
              <IconFlame className="w-3.5 h-3.5" />
              <span>{goals.streakDays}-Day Active Streak</span>
              <span className="opacity-40">·</span>
              <IconClock className="w-3.5 h-3.5" />
              <span>{formatDuration(totalFocusSeconds)} Tracked</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Executive Workspace Overview
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
              You have{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {todayPending.length} tasks scheduled for today
              </span>{' '}
              and{' '}
              <span
                className={
                  overdueTasks.length > 0
                    ? 'font-semibold text-rose-500'
                    : 'font-semibold text-emerald-500'
                }
              >
                {overdueTasks.length} overdue items
              </span>
              . All systems synced.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenAIModal}
              className="px-4 py-2.5 rounded-xl pro-surface hover:border-[var(--accent-primary)] text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <IconSparkles className="w-4 h-4 pro-text-accent" />
              <span>AI Smart Plan</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="px-4 py-2.5 rounded-xl pro-btn-accent font-semibold text-xs flex items-center gap-2 cursor-pointer"
            >
              <IconPlus className="w-4 h-4" />
              <span>Quick-Add Task</span>
            </button>
          </div>
        </div>

        {/* Integrated Quick-Command Task Bar */}
        <form
          onSubmit={handleQuickAddSubmit}
          className="relative z-10 mt-5 flex flex-col sm:flex-row gap-2 bg-slate-100/80 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200/80 dark:border-white/[0.07]"
        >
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Create a task for today and press Enter (e.g., Finalize architecture review at 6:00 PM)..."
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value as Priority)}
              className="text-xs font-medium rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] focus:outline-none"
            >
              <option value="urgent">Urgent Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="text-xs font-medium rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg pro-btn-accent font-semibold text-xs shrink-0 cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>

      {/* 5 Bento Telemetry Cards: Today's Tasks, Upcoming, Overdue, Completion %, Productivity Streak */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* Today's Tasks */}
        <div
          onClick={() => onNavigateView('today')}
          className="p-4 rounded-xl pro-surface pro-surface-interactive cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Today&apos;s Tasks
            </span>
            <span className="w-8 h-8 rounded-lg pro-bg-accent-soft flex items-center justify-center">
              <IconCalendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-[var(--accent-primary)]">
              {todayPending.length}
            </p>
            <span className="text-xs text-slate-400 font-medium">
              / {todayDoneCount} done
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active for today
          </p>
        </div>

        {/* Upcoming Tasks */}
        <div
          onClick={() => onNavigateView('upcoming')}
          className="p-4 rounded-xl pro-surface pro-surface-interactive cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Upcoming
            </span>
            <span className="w-8 h-8 rounded-lg bg-sky-500/12 text-sky-500 flex items-center justify-center">
              <IconClock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-3 group-hover:text-sky-500">
            {upcomingTasks.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Scheduled ahead
          </p>
        </div>

        {/* Overdue Tasks */}
        <div
          onClick={() => onNavigateView('overdue')}
          className="p-4 rounded-xl pro-surface pro-surface-interactive cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">
              Overdue
            </span>
            <span className="w-8 h-8 rounded-lg bg-rose-500/12 text-rose-500 flex items-center justify-center">
              <IconAlert className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-rose-500 mt-3">
            {overdueTasks.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Requires attention
          </p>
        </div>

        {/* Completion Percentage */}
        <div
          onClick={() => onNavigateView('analytics')}
          className="p-4 rounded-xl pro-surface pro-surface-interactive cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Completion Rate
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-500/12 text-emerald-500 flex items-center justify-center">
              <IconCheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-2xl font-bold tracking-tight text-emerald-500">
              {completionPercentage}%
            </p>
            <span className="text-xs text-slate-400">
              ({completedTasks.length}/{activeTasks.length})
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Productivity Streak */}
        <div
          onClick={() => onNavigateView('analytics')}
          className="p-4 rounded-xl pro-surface pro-surface-interactive cursor-pointer col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
              Active Streak
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-500/12 text-amber-500 flex items-center justify-center">
              <IconFlame className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-3">
            {goals.streakDays} Days
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Best record: {goals.bestStreak}d
          </p>
        </div>
      </div>

      {/* Bento Row: Weekly Progress Chart + Daily & Weekly Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Progress Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl pro-surface">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg pro-bg-accent-soft flex items-center justify-center">
                <IconChart className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Weekly Progress & Velocity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Completed tasks vs. daily target ({goals.dailyTasksGoal} tasks/day)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateView('analytics')}
              className="text-xs font-semibold pro-text-accent hover:underline"
            >
              View Telemetry →
            </button>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
            {weeklyChartData.map((item) => {
              const heightPct = Math.max(14, Math.round((item.completed / maxBar) * 100));
              return (
                <div
                  key={item.day}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                >
                  <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {item.completed}
                  </span>
                  <div className="w-full max-w-[38px] bg-slate-100 dark:bg-slate-800/70 rounded-lg h-full flex items-end overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/[0.04]">
                    <div
                      className="w-full rounded-md transition-all duration-500"
                      style={{
                        height: `${heightPct}%`,
                        background: item.isToday
                          ? 'linear-gradient(to top, var(--accent-primary), var(--accent-secondary))'
                          : item.completed >= item.target
                            ? '#10b981'
                            : 'var(--accent-primary)',
                        opacity: item.isToday ? 1 : 0.72,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      item.isToday
                        ? 'pro-text-accent font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goals & AI Executive Brief */}
        <div className="p-5 rounded-2xl pro-surface flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg pro-bg-accent-soft flex items-center justify-center">
                <IconTarget className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daily & Weekly Goals
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time target tracking
                </p>
              </div>
            </div>

            {/* Daily Goal */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-600 dark:text-slate-300">Daily Target</span>
                <span className="font-mono font-semibold pro-text-accent">
                  {todayDoneCount}/{goals.dailyTasksGoal} ({dailyGoalPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${dailyGoalPercent}%`,
                    background: 'var(--accent-primary)',
                  }}
                />
              </div>
            </div>

            {/* Weekly Goal */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-600 dark:text-slate-300">Weekly Target</span>
                <span className="font-mono font-semibold text-emerald-500">
                  {completedTasks.length}/{goals.weeklyTasksGoal} ({weeklyGoalPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${weeklyGoalPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* AI Copilot Card */}
          <div className="p-3.5 rounded-xl pro-bg-accent-soft border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <IconSparkles className="w-3.5 h-3.5" />
                <span>AI Priority Synthesis</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {overdueTasks.length > 0
                ? `Clear "${overdueTasks[0].title}" first to unblock downstream dependencies, then focus on Today's High Priority tasks.`
                : `Zero overdue bottlenecks. Complete ${Math.max(1, goals.dailyTasksGoal - todayDoneCount)} more tasks today to extend your ${goals.streakDays}-day streak.`}
            </p>
            <button
              type="button"
              onClick={onOpenAIModal}
              className="text-xs font-semibold pro-text-accent hover:underline"
            >
              Launch AI Task Breakdown →
            </button>
          </div>
        </div>
      </div>

      {/* Main Task Streams: Overdue, Today's Tasks, Upcoming Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Stream: Overdue + Today */}
        <div className="space-y-6">
          {overdueTasks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-2">
                  <IconAlert className="w-3.5 h-3.5" />
                  <span>Overdue Attention ({overdueTasks.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigateView('overdue')}
                  className="text-xs text-slate-400 hover:text-rose-500"
                >
                  View all →
                </button>
              </div>
              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    allTasks={tasks}
                    collaborators={collaborators}
                    tagsList={tagsList}
                    isSelected={selectedTaskId === task.id}
                    activeTimerTaskId={activeTimerTaskId}
                    onSelect={onSelectTask}
                    onToggleComplete={onToggleComplete}
                    onToggleImportant={onToggleImportant}
                    onToggleReminder={onToggleReminder}
                    onToggleSubtask={onToggleSubtask}
                    onStartTimer={onStartTimer}
                    onDuplicate={onDuplicate}
                    onSaveAsTemplate={onSaveAsTemplate}
                    onArchive={onArchive}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Today's Tasks */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <IconCalendar className="w-3.5 h-3.5 pro-text-accent" />
                <span>Today&apos;s Execution ({todayTasks.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => onNavigateView('today')}
                className="text-xs pro-text-accent hover:underline"
              >
                Open Today →
              </button>
            </div>
            {todayTasks.length === 0 ? (
              <div className="p-8 rounded-xl pro-surface text-center">
                <p className="text-xs text-slate-500">All tasks for today are complete.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    allTasks={tasks}
                    collaborators={collaborators}
                    tagsList={tagsList}
                    isSelected={selectedTaskId === task.id}
                    activeTimerTaskId={activeTimerTaskId}
                    onSelect={onSelectTask}
                    onToggleComplete={onToggleComplete}
                    onToggleImportant={onToggleImportant}
                    onToggleReminder={onToggleReminder}
                    onToggleSubtask={onToggleSubtask}
                    onStartTimer={onStartTimer}
                    onDuplicate={onDuplicate}
                    onSaveAsTemplate={onSaveAsTemplate}
                    onArchive={onArchive}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Stream: Upcoming Tasks */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <IconClock className="w-3.5 h-3.5 text-sky-500" />
              <span>Upcoming Pipeline ({upcomingTasks.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateView('upcoming')}
              className="text-xs pro-text-accent hover:underline"
            >
              Open Upcoming →
            </button>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="p-8 rounded-xl pro-surface text-center">
              <p className="text-xs text-slate-500">No upcoming tasks scheduled.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  allTasks={tasks}
                  collaborators={collaborators}
                  tagsList={tagsList}
                  isSelected={selectedTaskId === task.id}
                  activeTimerTaskId={activeTimerTaskId}
                  onSelect={onSelectTask}
                  onToggleComplete={onToggleComplete}
                  onToggleImportant={onToggleImportant}
                  onToggleReminder={onToggleReminder}
                  onToggleSubtask={onToggleSubtask}
                  onStartTimer={onStartTimer}
                  onDuplicate={onDuplicate}
                  onSaveAsTemplate={onSaveAsTemplate}
                  onArchive={onArchive}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

