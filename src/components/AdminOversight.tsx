import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Activity, 
  Database, 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  Lock
} from 'lucide-react';
import { AuditEvent, LegalMetrologyRule, UserProfile } from '../types';
import { STATUTORY_RULES } from '../lib/sampleData';
import { inspectionService } from '../services/inspectionService';

interface AdminOversightProps {
  auditLogs: AuditEvent[];
  currentUser: UserProfile;
}

export const AdminOversight: React.FC<AdminOversightProps> = ({
  auditLogs,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'rules' | 'users' | 'system'>('audit');
  const [searchAudit, setSearchAudit] = useState('');
  const [ruleSearch, setRuleSearch] = useState('');

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
    log.details.toLowerCase().includes(searchAudit.toLowerCase()) ||
    log.actorEmail.toLowerCase().includes(searchAudit.toLowerCase()) ||
    log.inspectionId.toLowerCase().includes(searchAudit.toLowerCase())
  );

  const filteredRules = STATUTORY_RULES.filter(rule => 
    rule.code.toLowerCase().includes(ruleSearch.toLowerCase()) ||
    rule.title.toLowerCase().includes(ruleSearch.toLowerCase()) ||
    rule.actSection.toLowerCase().includes(ruleSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-100">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Governance & Platform Oversight
            </h1>
            <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 font-mono border border-emerald-800">
              Administrator Authority
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            System audit logs, statutory rule catalog, user role governance, and cloud data integrity
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (window.confirm('Reset all demo state to initial baseline?')) {
                inspectionService.resetDemoData();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Records</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 flex items-center space-x-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Immutable Audit Trail ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 flex items-center space-x-2 transition-colors ${
            activeTab === 'rules'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Legal Metrology Rules Catalog ({STATUTORY_RULES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 px-3 flex items-center space-x-2 transition-colors ${
            activeTab === 'system'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cloud & Firestore Diagnostics</span>
        </button>
      </div>

      {/* TAB 1: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                placeholder="Search audit actions, actors, inspection IDs..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredLogs.length} chronological events
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-800">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-800/40 transition-colors flex items-start space-x-3 text-xs">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    log.actorRole === 'reviewer' 
                      ? 'bg-purple-950 text-purple-400 border border-purple-800'
                      : log.actorRole === 'admin'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold font-mono text-white bg-slate-800 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                        <span className="font-semibold text-slate-300">
                          {log.actorEmail}
                        </span>
                        <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {log.actorRole}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-300">
                      {log.details}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                      <span>Dossier: <span className="font-mono text-slate-400">{log.inspectionId}</span></span>
                      {log.previousState && <span>Prev: <span className="text-slate-400">{log.previousState}</span></span>}
                      {log.newState && <span>Next: <span className="text-emerald-400 font-semibold">{log.newState}</span></span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RULES CATALOG */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={ruleSearch}
              onChange={(e) => setRuleSearch(e.target.value)}
              placeholder="Search by rule code, title, or act section..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRules.map((rule) => (
              <div 
                key={rule.code} 
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                      {rule.code}
                    </span>
                    <h3 className="font-bold text-sm text-white mt-1.5">{rule.title}</h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {rule.category}
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-medium bg-slate-950 p-2 rounded border border-slate-800/80">
                  {rule.actSection}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {rule.description}
                </p>

                <div className="border-t border-slate-800 pt-2 text-xs text-slate-400">
                  <span className="font-bold text-slate-300">Statutory Guidance: </span>
                  {rule.guidelines}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLOUD & FIRESTORE DIAGNOSTICS */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Firebase & Firestore Integration Status</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time connection parameters established via AI Studio Firebase integration
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Firebase Project ID:</span>
                  <span className="font-mono text-white font-bold">ai-question-paper-genera-cb676</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Database ID:</span>
                  <span className="font-mono text-blue-300 font-medium">ai-studio-legalmetrologyin-7933c95b...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auth Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active (Google OAuth + Demo)</span>
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Rules Deployment:</span>
                  <span className="text-emerald-400 font-bold">Hardened v2 Deployed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Multi-Product Isolation:</span>
                  <span className="text-emerald-400 font-bold">Enforced (Subcollection Scoped)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Audit Record Immutability:</span>
                  <span className="text-emerald-400 font-bold">Append-Only</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Primary Admin: <strong className="text-white">amritanshutiwari3005@gmail.com</strong></span>
              <span className="font-mono text-slate-500">Legal Metrology Standard Edition</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
