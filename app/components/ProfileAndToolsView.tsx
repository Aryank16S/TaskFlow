'use client';

import React, { useState } from 'react';
import {
  Task,
  TaskTemplate,
  Collaborator,
  AppGoals,
} from '../types/todo';
import {
  IconLayers,
  IconUsers,
  IconDownload,
  IconUpload,
  IconFlame,
  IconCheckCircle,
  IconX,
} from './Icons';

interface ProfileAndToolsViewProps {
  tasks: Task[];
  templates: TaskTemplate[];
  collaborators: Collaborator[];
  goals: AppGoals;
  onApplyTemplate: (tpl: TaskTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onAddCollaborator: (name: string, email: string, role: string) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportTasks: (imported: Task[]) => void;
  onResetDemoData: () => void;
}

export default function ProfileAndToolsView({
  tasks,
  templates,
  collaborators,
  goals,
  onApplyTemplate,
  onDeleteTemplate,
  onAddCollaborator,
  onExportJSON,
  onExportCSV,
  onImportTasks,
  onResetDemoData,
}: ProfileAndToolsViewProps) {
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole] = useState('Developer');
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) return;
    onAddCollaborator(memberName.trim(), memberEmail.trim(), memberRole.trim());
    setMemberName('');
    setMemberEmail('');
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJsonText);
      if (Array.isArray(parsed)) {
        onImportTasks(parsed);
        setImportStatus(`Successfully imported ${parsed.length} tasks!`);
        setImportJsonText('');
      } else {
        setImportStatus('Error: JSON must be an array of tasks.');
      }
    } catch {
      setImportStatus('Invalid JSON format. Please check syntax.');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '[]'));
        if (Array.isArray(parsed)) {
          onImportTasks(parsed);
          setImportStatus(`Imported ${parsed.length} tasks from ${file.name}!`);
        }
      } catch {
        setImportStatus('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const shortcuts = [
    { keys: 'Ctrl + K / Cmd + K', desc: 'Open Command Palette & Quick Actions' },
    { keys: 'N', desc: 'Open Create New Task Modal' },
    { keys: 'Ctrl + Z', desc: 'Undo last task change' },
    { keys: 'Ctrl + Y', desc: 'Redo task change' },
    { keys: '/', desc: 'Focus Advanced Search Bar' },
    { keys: 'D', desc: 'Toggle Dark / Light Mode' },
    { keys: '1 / 2 / 3 / 4', desc: 'Switch between Dashboard, Kanban, Calendar, Analytics' },
    { keys: 'Esc', desc: 'Close active Drawer or Modal' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* User Profile & Streak Header */}
      <div className="p-6 rounded-2xl pro-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl pro-btn-accent text-lg font-bold flex items-center justify-center shadow-md">
            AR
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Alex Rivera
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              alex@workspace.dev · Enterprise Workspace Lead
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-500 flex items-center gap-1">
                <IconFlame className="w-3.5 h-3.5" /> {goals.streakDays}-Day Streak
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold pro-bg-accent-soft flex items-center gap-1">
                <IconCheckCircle className="w-3.5 h-3.5" /> {tasks.filter((t) => t.completed).length} Completed
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetDemoData}
          className="px-4 py-2 rounded-xl text-xs font-semibold pro-surface hover:border-[var(--accent-primary)] self-start sm:self-center cursor-pointer"
        >
          Reset Demo Workspace
        </button>
      </div>

      {/* Grid: Templates + Team Collaboration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Templates Library */}
        <div className="p-5 rounded-2xl pro-surface space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg pro-bg-accent-soft flex items-center justify-center">
              <IconLayers className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Task Templates Library
              </h2>
              <p className="text-xs text-slate-500">
                Deploy reusable multi-step workflows in one click
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {tpl.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {tpl.category} · {tpl.subtasks.length} subtasks · {tpl.recurrence}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onApplyTemplate(tpl)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold pro-btn-accent cursor-pointer"
                  >
                    + Use
                  </button>
                  {tpl.id.startsWith('custom-') && (
                    <button
                      type="button"
                      onClick={() => onDeleteTemplate(tpl.id)}
                      className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-500"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Collaboration & Sharing */}
        <div className="p-5 rounded-2xl pro-surface space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg pro-bg-accent-soft flex items-center justify-center">
              <IconUsers className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Team Collaboration & Sharing
              </h2>
              <p className="text-xs text-slate-500">
                Invite teammates to assign tasks, share notes, and post comments
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06]"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-full ${c.color} text-white text-xs font-bold flex items-center justify-center`}
                  >
                    {c.initials}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{c.email}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium pro-bg-accent-soft">
                  {c.role}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Teammate name"
              className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07]"
            />
            <input
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="email@team.dev"
              className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07]"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg text-xs font-semibold pro-btn-accent cursor-pointer"
            >
              + Invite Member
            </button>
          </form>
        </div>
      </div>

      {/* Grid: Import / Export + Keyboard Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl pro-surface space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Import & Export Workspace Data
            </h2>
            <p className="text-xs text-slate-500">
              Backup tasks as JSON or CSV spreadsheets, or restore from JSON
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onExportJSON}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold pro-btn-accent flex items-center gap-1.5 cursor-pointer"
            >
              <IconDownload className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={onExportCSV}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1.5 cursor-pointer"
            >
              <IconDownload className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <label className="px-3.5 py-2 rounded-lg text-xs font-semibold pro-surface hover:border-[var(--accent-primary)] cursor-pointer flex items-center gap-1.5">
              <IconUpload className="w-3.5 h-3.5" />
              <span>Import JSON File</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileImport}
              />
            </label>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-2">
            <textarea
              rows={3}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='Or paste raw JSON array of tasks here: [{"title": "My Task", ...}]'
              className="w-full text-xs font-mono p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07]"
            />
            <div className="flex items-center justify-between">
              {importStatus ? (
                <span className="text-xs pro-text-accent font-medium">
                  {importStatus}
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold pro-surface hover:border-[var(--accent-primary)]"
              >
                Import JSON Text
              </button>
            </div>
          </form>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="p-5 rounded-2xl pro-surface space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-slate-500">
              Navigate and manage tasks at lightning speed
            </p>
          </div>

          <div className="space-y-1.5">
            {shortcuts.map((s) => (
              <div
                key={s.keys}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50/80 dark:bg-white/[0.03] text-xs"
              >
                <span className="text-slate-600 dark:text-slate-300">{s.desc}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] font-mono text-[11px] font-bold pro-text-accent">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

