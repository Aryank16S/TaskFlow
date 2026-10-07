'use client';

import React, { useState } from 'react';
import {
  IconCheck,
  IconClose,
  IconShield,
  IconSparkles,
  IconUser,
  IconLayers,
} from './Icons';

export interface ClientAuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  avatarColor: string;
  createdAt?: string;
}

export interface DbStatusInfo {
  engine: 'postgresql' | 'mysql' | 'embedded-sql';
  label: string;
  connected: boolean;
  hostHint: string;
}

interface AuthModalProps {
  isOpen: boolean;
  currentUser: ClientAuthUser | null;
  dbInfo: DbStatusInfo;
  lastSyncedAt: string | null;
  onClose: () => void;
  onAuthSuccess: (user: ClientAuthUser | null, db: DbStatusInfo) => void;
}

export default function AuthModal({
  isOpen,
  currentUser,
  dbInfo,
  lastSyncedAt,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'database'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex@taskflow.io');
  const [password, setPassword] = useState('Demo@1234');
  const [role, setRole] = useState('Product Lead');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDbGuide, setSelectedDbGuide] = useState<'postgresql' | 'mysql'>('postgresql');
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activeTab === 'register' ? 'register' : 'login',
          name,
          email,
          password,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
      } else {
        onAuthSuccess(data.user, data.db || dbInfo);
        onClose();
      }
    } catch {
      setError('Unable to reach authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'demo' }),
      });
      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data.user, data.db || dbInfo);
        onClose();
      }
    } catch {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      const data = await res.json();
      onAuthSuccess(null, data.db || dbInfo);
    } finally {
      setLoading(false);
    }
  };

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl pro-surface bg-white dark:bg-[#0d121f] border border-slate-200/80 dark:border-slate-800/90 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Executive Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25">
              <IconShield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">
                  TaskFlow Identity &amp; SQL Database Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  {dbInfo.engine === 'postgresql'
                    ? 'PostgreSQL Active'
                    : dbInfo.engine === 'mysql'
                      ? 'MySQL Active'
                      : 'SQL Store Connected'}
                </span>
              </div>
              <p className="text-[11px] text-indigo-100/90 mt-0.5">
                Signed HTTP-only session authentication · PostgreSQL &amp; MySQL 8.0 compatible
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setError(null);
              }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'signin'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <IconUser className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'register'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <IconSparkles className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('database');
                setError(null);
              }}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'database'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <IconLayers className="w-3.5 h-3.5" />
              <span>PostgreSQL / MySQL</span>
            </button>
          </div>

          {lastSyncedAt && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Synced {lastSyncedAt}
            </span>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[78vh] overflow-y-auto">
          {activeTab !== 'database' ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left Form */}
              <form onSubmit={handleSubmit} className="md:col-span-3 space-y-3.5">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs font-medium text-rose-600 dark:text-rose-300">
                    {error}
                  </div>
                )}

                {activeTab === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/70 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Role / Title
                      </label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Engineering Lead"
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/70 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@taskflow.io"
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/70 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/70 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-2.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 rounded-xl pro-btn-accent text-xs font-semibold disabled:opacity-50"
                  >
                    {loading
                      ? 'Authenticating...'
                      : activeTab === 'register'
                        ? 'Create Workspace Account'
                        : 'Sign In to Workspace'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    1-Click Demo
                  </button>
                </div>
              </form>

              {/* Right Active Session & Security Card */}
              <div className="md:col-span-2 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Active Session
                  </span>
                  {currentUser ? (
                    <div className="mt-2.5 flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${currentUser.avatarColor} text-white font-bold text-xs flex items-center justify-center shadow-sm`}
                      >
                        {currentUser.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          ● Authenticated ({currentUser.role})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-2">
                      Guest mode active. Sign in to bind tasks to your personal account.
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Database Engine:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {dbInfo.engine.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Password Hash:</span>
                      <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300">
                        scrypt + salt
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Session Token:</span>
                      <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300">
                        HMAC-SHA256 Cookie
                      </span>
                    </div>
                  </div>
                </div>

                {currentUser && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                  >
                    Sign Out of Session
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* PostgreSQL & MySQL Configuration Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Active Engine: {dbInfo.label}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Storage Target: <code className="font-mono">{dbInfo.hostHint}</code> — All task
                    mutations automatically sync via <code className="font-mono">/api/tasks</code>.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDbGuide('postgresql')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedDbGuide === 'postgresql'
                        ? 'pro-btn-accent'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    PostgreSQL 16
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDbGuide('mysql')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedDbGuide === 'mysql'
                        ? 'pro-btn-accent'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    MySQL 8.0
                  </button>
                </div>
              </div>

              {selectedDbGuide === 'postgresql' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Connect PostgreSQL (Local, Supabase, Neon, or Railway)
                    </h5>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Schema: database/schema.postgres.sql
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-950 text-slate-100 p-3.5 font-mono text-[11px] space-y-1.5 relative border border-slate-800">
                    <p className="text-slate-400"># 1. Install PostgreSQL driver &amp; apply schema</p>
                    <p className="text-emerald-400">npm install pg @types/pg</p>
                    <p className="text-emerald-400">
                      psql -U postgres -d taskflow -f database/schema.postgres.sql
                    </p>
                    <p className="text-slate-400 pt-1"># 2. Set DATABASE_URL in .env.local</p>
                    <p className="text-indigo-300">
                      DATABASE_URL=&quot;postgresql://postgres:password@localhost:5432/taskflow&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        copySnippet(
                          'DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow"'
                        )
                      }
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-sans font-semibold text-slate-200 flex items-center gap-1"
                    >
                      {copiedCmd ? <IconCheck className="w-3 h-3 text-emerald-400" /> : null}
                      <span>{copiedCmd ? 'Copied' : 'Copy ENV'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Connect MySQL 8.0+ (Local MySQL, PlanetScale, TiDB, or Aiven)
                    </h5>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Schema: database/schema.mysql.sql
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-950 text-slate-100 p-3.5 font-mono text-[11px] space-y-1.5 relative border border-slate-800">
                    <p className="text-slate-400"># 1. Install MySQL driver &amp; apply schema (PowerShell safe)</p>
                    <p className="text-emerald-400">npm install mysql2</p>
                    <p className="text-emerald-400">
                      Get-Content database/schema.mysql.sql | mysql -u root -p taskflow
                    </p>
                    <p className="text-slate-400 pt-1"># 2. Set DATABASE_URL in .env.local</p>
                    <p className="text-indigo-300">
                      DATABASE_URL=&quot;mysql://root:password@localhost:3306/taskflow&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        copySnippet(
                          'DATABASE_URL="mysql://root:password@localhost:3306/taskflow"'
                        )
                      }
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-sans font-semibold text-slate-200 flex items-center gap-1"
                    >
                      {copiedCmd ? <IconCheck className="w-3 h-3 text-emerald-400" /> : null}
                      <span>{copiedCmd ? 'Copied' : 'Copy ENV'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
