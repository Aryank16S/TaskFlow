'use client';

import React from 'react';
import {
  Task,
  AppGoals,
  Project,
  Priority,
} from '../types/todo';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatDuration,
  isTaskOverdue,
} from '../data/initialData';

interface AnalyticsViewProps {
  tasks: Task[];
  goals: AppGoals;
  projects: Project[];
  onUpdateGoals: (nextGoals: AppGoals) => void;
}

export default function AnalyticsView({
  tasks,
  goals,
  projects,
  onUpdateGoals,
}: AnalyticsViewProps) {
  const activeTasks = tasks.filter((t) => !t.trashed);
  const completedTasks = activeTasks.filter((t) => t.completed);
  const overdueTasks = activeTasks.filter((t) => isTaskOverdue(t));

  const completionRate =
    activeTasks.length > 0
      ? Math.round((completedTasks.length / activeTasks.length) * 100)
      : 0;

  const totalFocusSeconds = activeTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  const totalSubtasks = activeTasks.reduce((sum, t) => sum + t.subtasks.length, 0);
  const completedSubtasks = activeTasks.reduce(
    (sum, t) => sum + t.subtasks.filter((s) => s.completed).length,
    0
  );

  // Productivity Score calculation (0 - 100)
  const productivityScore = Math.min(
    100,
    Math.round(
      completionRate * 0.5 +
        Math.min(30, goals.streakDays * 2) +
        Math.min(20, Math.round(totalFocusSeconds / 600))
    )
  );

  const priorities: Priority[] = ['urgent', 'high', 'medium', 'low'];

  // Weekly Productivity & Completion dual bar data
  const weeklyTrend = [
    { label: 'Mon', completed: 5, focusMins: 95 },
    { label: 'Tue', completed: 6, focusMins: 120 },
    { label: 'Wed', completed: 4, focusMins: 85 },
    { label: 'Thu', completed: 7, focusMins: 145 },
    { label: 'Fri', completed: 6, focusMins: 110 },
    { label: 'Sat', completed: 3, focusMins: 60 },
    {
      label: 'Sun',
      completed: Math.max(2, completedTasks.length),
      focusMins: Math.max(45, Math.round(totalFocusSeconds / 60)),
    },
  ];
  const maxCompleted = Math.max(8, ...weeklyTrend.map((d) => d.completed));
  const maxFocus = Math.max(150, ...weeklyTrend.map((d) => d.focusMins));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📊</span> Productivity & Performance Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deep insights into your task completion velocity, priority distribution, focus hours, and streaks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">
              Productivity Score
            </span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {productivityScore} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Completion Rate
          </span>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {completionRate}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {completedTasks.length} of {activeTasks.length} tasks done
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Focus Time
          </span>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            {formatDuration(totalFocusSeconds)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Across {activeTasks.filter((t) => t.timeSpent > 0).length} tracked tasks
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Checklist Velocity
          </span>
          <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
            {completedSubtasks}/{totalSubtasks}
          </p>
          <p className="text-xs text-slate-500 mt-1">Subtasks completed</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Streak
          </span>
          <p className="text-3xl font-extrabold text-amber-500 mt-2">
            🔥 {goals.streakDays}d
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Best record: {goals.bestStreak} days
          </p>
        </div>
      </div>

      {/* Charts Grid: Weekly Completion & Focus Hours + Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Weekly Completion & Focus Velocity */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                📈 Weekly Completion & Focus Hours
              </h3>
              <p className="text-xs text-slate-500">
                Tasks completed (Indigo) vs. Focus time logged (Emerald)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" /> Tasks
              </span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Focus
              </span>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2">
            {weeklyTrend.map((d) => {
              const taskPct = Math.max(12, Math.round((d.completed / maxCompleted) * 100));
              const focusPct = Math.max(12, Math.round((d.focusMins / maxFocus) * 100));
              return (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    <div
                      title={`${d.completed} tasks completed`}
                      className="w-3.5 sm:w-4 bg-indigo-500 rounded-t-md transition-all duration-500"
                      style={{ height: `${taskPct}%` }}
                    />
                    <div
                      title={`${d.focusMins}m focused`}
                      className="w-3.5 sm:w-4 bg-emerald-500 rounded-t-md transition-all duration-500"
                      style={{ height: `${focusPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Priority Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              📌 Tasks by Priority Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Distribution and completion ratio across priority levels
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {priorities.map((p) => {
              const pTasks = activeTasks.filter((t) => t.priority === p);
              const pDone = pTasks.filter((t) => t.completed).length;
              const pct =
                activeTasks.length > 0
                  ? Math.round((pTasks.length / activeTasks.length) * 100)
                  : 0;
              const meta = PRIORITY_CONFIG[p];

              return (
                <div key={p} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <span className={`w-2.5 h-2.5 rounded-full ${meta.dotColor}`} />
                      {meta.label}
                    </span>
                    <span className="text-slate-500">
                      <strong className="text-slate-800 dark:text-slate-200">{pTasks.length}</strong> tasks ({pDone} done · {pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${meta.dotColor} transition-all duration-500`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Category / Project Analytics + Status Pipeline + Configurable Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category / Project Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            📁 Category & Project Velocity
          </h3>
          <div className="space-y-3">
            {projects.map((proj) => {
              const projTasks = activeTasks.filter((t) => t.category === proj.name);
              const projDone = projTasks.filter((t) => t.completed).length;
              const projFocus = projTasks.reduce((s, t) => s + t.timeSpent, 0);
              const pct =
                projTasks.length > 0 ? Math.round((projDone / projTasks.length) * 100) : 0;

              return (
                <div
                  key={proj.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {proj.icon} {proj.name}
                    </span>
                    <span className="text-slate-500">
                      {projDone}/{projTasks.length} done · ⏱️ {formatDuration(projFocus)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: proj.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Pipeline Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            🔄 Workflow Stage Pipeline
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(['todo', 'in-progress', 'review', 'done'] as const).map((st) => {
              const count = activeTasks.filter((t) => t.status === st).length;
              const stMeta = STATUS_CONFIG[st];
              return (
                <div
                  key={st}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${stMeta.dot}`} />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {stMeta.label}
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                    {count}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                ⚠️ Overdue Bottlenecks
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tasks past their target deadline
              </p>
            </div>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400">
              {overdueTasks.length}
            </span>
          </div>
        </div>

        {/* Customize Daily & Weekly Goals */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            🎯 Configure Daily & Weekly Targets
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Daily Tasks Target ({goals.dailyTasksGoal} tasks/day)
              </label>
              <input
                type="range"
                min={1}
                max={15}
                value={goals.dailyTasksGoal}
                onChange={(e) =>
                  onUpdateGoals({ ...goals, dailyTasksGoal: Number(e.target.value) })
                }
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Weekly Tasks Target ({goals.weeklyTasksGoal} tasks/week)
              </label>
              <input
                type="range"
                min={5}
                max={75}
                step={5}
                value={goals.weeklyTasksGoal}
                onChange={(e) =>
                  onUpdateGoals({ ...goals, weeklyTasksGoal: Number(e.target.value) })
                }
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Daily Focus Minutes Target ({goals.dailyFocusMinutesGoal} mins)
              </label>
              <input
                type="range"
                min={25}
                max={300}
                step={25}
                value={goals.dailyFocusMinutesGoal}
                onChange={(e) =>
                  onUpdateGoals({ ...goals, dailyFocusMinutesGoal: Number(e.target.value) })
                }
                className="w-full accent-purple-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
