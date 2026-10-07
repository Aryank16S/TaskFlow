'use client';

import React, { useState } from 'react';
import {
  Task,
  TaskStatus,
  Collaborator,
  TagItem,
} from '../types/todo';
import { STATUS_CONFIG } from '../data/initialData';
import TaskCard from './TaskCard';
import { IconPlus } from './Icons';

interface KanbanViewProps {
  tasks: Task[];
  allTasks: Task[];
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
  onMoveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onCreateInColumn: (title: string, status: TaskStatus) => void;
}

const COLUMNS: { status: TaskStatus; title: string; dotColor: string; borderAccent: string }[] = [
  {
    status: 'todo',
    title: 'To Do',
    dotColor: 'bg-slate-400',
    borderAccent: 'border-t-slate-400',
  },
  {
    status: 'in-progress',
    title: 'In Progress',
    dotColor: 'bg-indigo-500',
    borderAccent: 'border-t-indigo-500',
  },
  {
    status: 'review',
    title: 'Review',
    dotColor: 'bg-amber-500',
    borderAccent: 'border-t-amber-500',
  },
  {
    status: 'done',
    title: 'Done',
    dotColor: 'bg-emerald-500',
    borderAccent: 'border-t-emerald-500',
  },
];

export default function KanbanView({
  tasks,
  allTasks,
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
  onMoveTaskStatus,
  onCreateInColumn,
}: KanbanViewProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<TaskStatus | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDropOnColumn = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onMoveTaskStatus(taskId, status);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleCreateSubmit = (e: React.FormEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onCreateInColumn(newCardTitle.trim(), status);
    setNewCardTitle('');
    setAddingToColumn(null);
  };

  return (
    <div className="pb-20">
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Drag and drop cards across columns (To Do → In Progress → Review → Done) to update workflow stage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          const isOver = dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(col.status);
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDropOnColumn(e, col.status)}
              className={`rounded-2xl pro-surface border-t-[3px] transition-all p-3.5 min-h-[480px] flex flex-col ${
                col.borderAccent
              } ${
                isOver
                  ? 'ring-2 ring-[var(--accent-primary)] pro-bg-accent-soft'
                  : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    {col.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${STATUS_CONFIG[col.status].bg} ${STATUS_CONFIG[col.status].color}`}
                  >
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAddingToColumn(col.status);
                    setNewCardTitle('');
                  }}
                  className="w-6 h-6 rounded-lg pro-surface text-slate-500 hover:text-[var(--accent-primary)] flex items-center justify-center cursor-pointer"
                  title={`Add task to ${col.title}`}
                >
                  <IconPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Add Form inside Column */}
              {addingToColumn === col.status && (
                <form
                  onSubmit={(e) => handleCreateSubmit(e, col.status)}
                  className="mb-3 p-3 rounded-xl pro-surface border border-[var(--accent-primary)] shadow-md space-y-2"
                >
                  <input
                    type="text"
                    autoFocus
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    placeholder={`Task title in ${col.title}...`}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddingToColumn(null)}
                      className="px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg text-xs font-semibold pro-btn-accent"
                    >
                      Add Card
                    </button>
                  </div>
                </form>
              )}

              {/* Column Cards */}
              <div className="space-y-2.5 flex-1">
                {columnTasks.length === 0 ? (
                  <div className="h-36 rounded-xl border border-dashed border-slate-200 dark:border-white/[0.06] flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs text-slate-400">
                      Drop tasks here or click + to add to {col.title}
                    </p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      allTasks={allTasks}
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
                      onDragStart={handleDragStart}
                      compact
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

