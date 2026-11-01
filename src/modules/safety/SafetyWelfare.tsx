import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Phone,
  Copy,
  Check,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  Paperclip,
  X,
  Search,
  Building2,
  Shield,
  HeartPulse,
  UserCheck,
  Eye,
  RefreshCw,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  SafetyReport,
  SafetyIssueCategory,
  SafetyReportStatus,
  EmergencyHelpline,
  VerifiedSupportContact,
} from '../../types';

// ============================================================================
// OFFICIAL HELPLINES DIRECTORY (INDIA) - VERIFIED & COMPACT
// ============================================================================
const OFFICIAL_HELPLINES: EmergencyHelpline[] = [
  {
    id: 'help_112',
    service: 'National Emergency',
    helpline: '112',
    description: 'All-in-one unified emergency helpline for immediate Police, Fire, and Ambulance response across India.',
    isPrimary: true,
  },
  {
    id: 'help_1098',
    service: 'Child Helpline',
    helpline: '1098',
    description: '24-hour national emergency outreach and protection service for children and minors in distress.',
    isPrimary: false,
  },
  {
    id: 'help_1930',
    service: 'Cyber Financial Fraud',
    helpline: '1930',
    description: 'National cybercrime reporting portal helpline to report financial scams, phishing, and unauthorized online transactions.',
    isPrimary: false,
  },
  {
    id: 'help_181',
    service: 'Women Helpline',
    helpline: '181',
    description: '24/7 pan-India toll-free helpline providing immediate emergency support and counseling for women in distress.',
    isPrimary: false,
  },
  {
    id: 'help_14416',
    service: 'Tele-MANAS Support',
    helpline: '14416',
    description: 'National Tele Mental Health Programme of India providing 24/7 free, confidential psychological counseling and emotional wellbeing support.',
    isPrimary: false,
  },
  {
    id: 'help_14567',
    service: 'Elderline',
    helpline: '14567',
    description: 'National helpline for senior citizens and elderly welfare assistance, rescue, and guidance.',
    isPrimary: false,
  },
];

const ISSUE_CATEGORIES: SafetyIssueCategory[] = [
  'Ragging',
  'Bullying',
  'Harassment Concern',
  'Campus Safety',
  'Infrastructure Problem',
  'Hostel or Classroom Issue',
  'Other',
];

export const SafetyWelfare: React.FC = () => {
  const { user } = useAuth();

  // Navigation: Exactly 4 Main Sections
  const [activeTab, setActiveTab] = useState<'emergency' | 'report' | 'support' | 'history'>('emergency');

  // Copy Feedback Tracking
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<SafetyIssueCategory>('Ragging');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachment, setAttachment] = useState<{
    name: string;
    size: number;
    dataUrl: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<SafetyReport | null>(null);

  // Reports History State
  const [myReports, setMyReports] = useState<SafetyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SafetyReport | null>(null);

  // Anonymous Report Lookup
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [trackedReport, setTrackedReport] = useState<Partial<SafetyReport> | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Institutional Contacts State
  const [supportContacts, setSupportContacts] = useState<VerifiedSupportContact[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);

  // Load Reports History
  const loadReports = async () => {
    if (!user) return;
    setLoadingReports(true);
    try {
      const data = await apiService.getSafetyReports(user.id);
      setMyReports(data);
    } catch (err) {
      console.error('Failed to load safety reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  // Load Support Contacts
  const loadSupport = async () => {
    setLoadingSupport(true);
    try {
      const contacts = await apiService.getVerifiedSupportContacts();
      setSupportContacts(contacts);
    } catch (err) {
      console.error('Failed to load support contacts:', err);
    } finally {
      setLoadingSupport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadReports();
    } else if (activeTab === 'support') {
      loadSupport();
    }
  }, [activeTab, user]);

  // Copy to clipboard helper
  const handleCopy = (text: string, type: 'number' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'number') {
      setCopiedNumber(text);
      setTimeout(() => setCopiedNumber(null), 2000);
    } else {
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Handle Attachment Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Attachment file size must be less than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        size: file.size,
        dataUrl: reader.result as string,
      });
      setFormError(null);
    };
    reader.onerror = () => {
      setFormError('Failed to read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  // Generate Unique Report ID: REP-2026-XXXXX
  const generateReportCode = () => {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `REP-${year}-${code}`;
  };

  // Submit Incident Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!subject.trim()) {
      setFormError('Please enter a brief subject for this issue.');
      return;
    }
    if (subject.trim().length < 4) {
      setFormError('Subject is too short. Please provide at least 4 characters.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide a description of the issue.');
      return;
    }
    if (description.trim().length < 10) {
      setFormError('Please describe the issue in more detail (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const code = generateReportCode();
      const newReport = await apiService.submitSafetyReport({
        report_code: code,
        user_id: isAnonymous ? null : (user?.id || null),
        is_anonymous: isAnonymous,
        category,
        subject: subject.trim(),
        description: description.trim(),
        attachment_name: attachment?.name || null,
        attachment_url: attachment?.dataUrl || null,
        attachment_size: attachment?.size || null,
        status: 'Submitted',
      });

      setSubmittedReport(newReport);
      // Reset input form
      setSubject('');
      setDescription('');
      setAttachment(null);
      setIsAnonymous(false);
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      setFormError(err.message || 'An error occurred while submitting your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Track Anonymous Report by Code
  const handleTrackReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingCodeInput.trim().toUpperCase();
    if (!code) return;

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackedReport(null);

    try {
      const result = await apiService.trackReportStatus(code);
      if (result) {
        setTrackedReport(result);
      } else {
        setTrackingError(`No report found with code "${code}". Please check and try again.`);
      }
    } catch (err) {
      setTrackingError('Unable to look up report. Please try again.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: SafetyReportStatus) => {
    switch (status) {
      case 'Submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3" /> Submitted
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Eye className="w-3 h-3" /> Under Review
          </span>
        );
      case 'Action Taken':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <CheckCircle2 className="w-3 h-3" /> Action Taken
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Check className="w-3 h-3" /> Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#17365C]/60 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] tracking-tight">
                  Student Safety & Welfare
                </h1>
                <p className="text-xs text-[#9BAFCB] mt-0.5">
                  Verified emergency helplines, confidential incident reporting, campus support contacts, and status tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Simple Tab Navigation */}
          <nav className="flex items-center p-1 rounded-xl bg-[#061830] border border-[#17365C] overflow-x-auto">
            <button
              onClick={() => setActiveTab('emergency')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'emergency'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-[#9BAFCB] hover:text-[#F4F7FF]'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Emergency Help</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('report');
                setSubmittedReport(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                  : 'text-[#9BAFCB] hover:text-[#F4F7FF]'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Report an Issue</span>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'support'
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                  : 'text-[#9BAFCB] hover:text-[#F4F7FF]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Student Support</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                  : 'text-[#9BAFCB] hover:text-[#F4F7FF]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>My Reports</span>
              {myReports.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#17365C] text-[#F4F7FF]">
                  {myReports.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. EMERGENCY HELP SECTION                                             */}
      {/* ==================================================================== */}
      {activeTab === 'emergency' && (
        <div className="space-y-4">
          {/* Main 112 Advisory Banner */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-xs">
                <strong className="text-white font-semibold">Immediate Emergency Note:</strong> For immediate danger, physical threat, or medical emergency, contact <strong className="text-white underline">112</strong> immediately.
              </p>
            </div>
            <a
              href="tel:112"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call 112</span>
            </a>
          </div>

          {/* Helpline Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {OFFICIAL_HELPLINES.map((item) => {
              const isCopied = copiedNumber === item.helpline;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl flex flex-col justify-between transition border ${
                    item.isPrimary
                      ? 'bg-[#081830] border-rose-500/40 shadow-sm'
                      : 'bg-[#061830] border-[#17365C]/80 hover:border-[#17365C]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#9BAFCB]">
                        {item.service}
                      </span>
                      {item.isPrimary && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          PRIMARY 24/7
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-[#F4F7FF] tracking-tight">
                        {item.helpline}
                      </span>
                    </div>

                    <p className="text-xs text-[#9BAFCB] mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#17365C]/60 flex items-center gap-2">
                    {/* Call Button (Mobile Phone Dialer) */}
                    <a
                      href={`tel:${item.helpline}`}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition flex items-center justify-center gap-1.5 ${
                        item.isPrimary
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-[#087BFF] hover:bg-[#00D9FF] hover:text-[#020B1A] text-white'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    {/* Copy Button (Desktop / General) */}
                    <button
                      onClick={() => handleCopy(item.helpline, 'number')}
                      title="Copy helpline number"
                      className="py-1.5 px-2.5 rounded-lg border border-[#17365C] bg-[#071F3D] hover:bg-[#0C2D56] text-[#9BAFCB] hover:text-white text-xs transition flex items-center gap-1 shrink-0"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. REPORT AN ISSUE SECTION                                           */}
      {/* ==================================================================== */}
      {activeTab === 'report' && (
        <div className="max-w-2xl mx-auto">
          {submittedReport ? (
            /* Successful Submission Confirmation Card */
            <div className="p-6 rounded-2xl bg-[#061830] border border-emerald-500/30 text-[#F4F7FF] space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Report Successfully Submitted</h3>
                  <p className="text-xs text-[#9BAFCB] mt-0.5">
                    Your issue report has been securely registered in the campus safety system.
                  </p>
                </div>
              </div>

              {/* Unique Report ID Box */}
              <div className="p-3.5 rounded-xl bg-[#020B1A] border border-[#17365C] flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#9BAFCB] font-mono">UNIQUE REPORT ID</p>
                  <p className="text-lg font-bold font-mono text-[#00D9FF]">
                    {submittedReport.report_code}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(submittedReport.report_code, 'code')}
                  className="px-3 py-1.5 rounded-lg border border-[#17365C] bg-[#071F3D] hover:bg-[#0C2D56] text-xs text-white transition flex items-center gap-1.5"
                >
                  {copiedCode === submittedReport.report_code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#071F3D] border border-[#17365C]/60">
                  <span className="text-[#9BAFCB]">Category:</span>
                  <p className="font-medium text-white mt-0.5">{submittedReport.category}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#071F3D] border border-[#17365C]/60">
                  <span className="text-[#9BAFCB]">Initial Status:</span>
                  <div className="mt-0.5">{getStatusBadge(submittedReport.status)}</div>
                </div>
              </div>

              {submittedReport.is_anonymous ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Anonymous Submission:</strong> This report is not linked to your personal student account. Please save the Report ID above so you can look up its status later in <em>My Reports</em>.
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#9BAFCB]">
                  You can track this report and view administrative updates anytime under the <strong>My Reports</strong> tab.
                </p>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setSubmittedReport(null)}
                  className="px-4 py-2 rounded-xl bg-[#00D9FF] text-[#020B1A] font-semibold text-xs hover:bg-[#00D9FF]/90 transition"
                >
                  Submit Another Report
                </button>
                {!submittedReport.is_anonymous && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 rounded-xl bg-[#071F3D] border border-[#17365C] text-white text-xs hover:border-[#00D9FF]/40 transition"
                  >
                    View in My Reports
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Clean Report Submission Form */
            <form onSubmit={handleSubmitReport} className="p-5 rounded-2xl bg-[#061830] border border-[#17365C] space-y-4">
              <div className="border-b border-[#17365C]/60 pb-3">
                <h2 className="text-base font-bold text-white">Report a Campus Issue</h2>
                <p className="text-xs text-[#9BAFCB] mt-0.5">
                  Submit a confidential report regarding student safety, ragging, facilities, or campus concerns.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Issue Category */}
              <div>
                <label className="block text-xs font-medium text-[#9BAFCB] mb-1.5">
                  Issue Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SafetyIssueCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-[#020B1A] border border-[#17365C] text-xs text-[#F4F7FF] focus:outline-none focus:border-[#00D9FF]"
                >
                  {ISSUE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-[#9BAFCB] mb-1.5">
                  Subject <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Short summary of the issue (e.g. Broken streetlight behind Block B)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={120}
                  className="w-full px-3 py-2 rounded-xl bg-[#020B1A] border border-[#17365C] text-xs text-[#F4F7FF] placeholder-slate-500 focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#9BAFCB] mb-1.5">
                  Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide specific details such as date, time, location, persons involved, or any relevant circumstances..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#020B1A] border border-[#17365C] text-xs text-[#F4F7FF] placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] resize-none"
                />
              </div>

              {/* Optional Attachment */}
              <div>
                <label className="block text-xs font-medium text-[#9BAFCB] mb-1.5">
                  Optional Attachment <span className="text-[11px] text-slate-500">(Max 5MB - Image or Document)</span>
                </label>
                {attachment ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#020B1A] border border-[#17365C] text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="w-4 h-4 text-[#00D9FF] shrink-0" />
                      <span className="truncate text-white">{attachment.name}</span>
                      <span className="text-[10px] text-[#9BAFCB] shrink-0">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#17365C] hover:border-[#00D9FF]/40 cursor-pointer bg-[#020B1A]/40 text-xs text-[#9BAFCB] transition">
                    <Paperclip className="w-4 h-4" />
                    <span>Attach photo, screenshot, or document</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Anonymous Reporting Option */}
              <div className="p-3 rounded-xl bg-[#020B1A] border border-[#17365C] space-y-1.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#061830] border-[#17365C] text-[#00D9FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-white">
                    Submit this report anonymously
                  </span>
                </label>
                <p className="text-[11px] text-[#9BAFCB] pl-6.5 leading-relaxed">
                  When enabled, your name, student ID, and email address will <strong>NOT</strong> be recorded or linked in any database record. Only authorized campus welfare staff will receive the incident content.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubject('');
                    setDescription('');
                    setAttachment(null);
                    setIsAnonymous(false);
                    setFormError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-[#9BAFCB] hover:text-white transition"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-[#020B1A] font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. STUDENT SUPPORT SECTION                                           */}
      {/* ==================================================================== */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Institutional Contacts Notice */}
          <div className="border-b border-[#17365C]/60 pb-3">
            <h2 className="text-base font-bold text-white">Campus Support Directory</h2>
            <p className="text-xs text-[#9BAFCB] mt-0.5">
              Verified campus administration, security desk, medical clinic, and counseling office contacts.
            </p>
          </div>

          {/* Institutional Support Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {supportContacts.map((contact) => {
              const iconMap = {
                administration: Building2,
                security: Shield,
                medical: HeartPulse,
                counselor: UserCheck,
              };
              const IconComp = iconMap[contact.role] || Building2;

              return (
                <div
                  key={contact.id}
                  className="p-4 rounded-xl bg-[#061830] border border-[#17365C] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#087BFF]/15 text-[#00D9FF] border border-[#087BFF]/30">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white">{contact.title}</h3>
                          <p className="text-[11px] text-[#9BAFCB]">{contact.department}</p>
                        </div>
                      </div>

                      {contact.is_available ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">
                          Pending Setup
                        </span>
                      )}
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs">
                      {contact.location && (
                        <p className="text-[#9BAFCB]">
                          <span className="text-slate-400">Location:</span> {contact.location}
                        </p>
                      )}
                      {contact.hours && (
                        <p className="text-[#9BAFCB]">
                          <span className="text-slate-400">Hours:</span> {contact.hours}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#17365C]/60 flex items-center justify-between">
                    {contact.is_available && contact.phone ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-mono font-bold text-white">
                          {contact.phone}
                        </span>
                        <a
                          href={`tel:${contact.phone}`}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-[#087BFF] hover:bg-[#00D9FF] hover:text-[#020B1A] text-white transition flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-400">
                        Contact details not available
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple Cyber Safety Awareness Section */}
          <div className="p-5 rounded-2xl bg-[#061830] border border-[#17365C] space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00D9FF]" />
              <h3 className="text-sm font-bold text-white">Student Cyber Safety Awareness</h3>
            </div>
            <p className="text-xs text-[#9BAFCB] leading-relaxed">
              Basic digital security guidelines to protect your identity, academic accounts, and financial credentials on campus.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-[#020B1A] border border-[#17365C]/70">
                <p className="font-semibold text-white">1. Strong Passwords & 2FA</p>
                <p className="text-[11px] text-[#9BAFCB] mt-1 leading-relaxed">
                  Never share student portal passwords or OTPs with friends. College staff will never ask for your password.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#020B1A] border border-[#17365C]/70">
                <p className="font-semibold text-white">2. Phishing & Scam Links</p>
                <p className="text-[11px] text-[#9BAFCB] mt-1 leading-relaxed">
                  Do not click unverified links in WhatsApp or SMS promising fake stipends, fee discounts, or exam leaks.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#020B1A] border border-[#17365C]/70">
                <p className="font-semibold text-white">3. Public Wi-Fi Security</p>
                <p className="text-[11px] text-[#9BAFCB] mt-1 leading-relaxed">
                  Avoid conducting banking or UPI transactions on unsecured open campus Wi-Fi networks without HTTPS.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#020B1A] border border-[#17365C]/70">
                <p className="font-semibold text-white">4. Financial Fraud Response</p>
                <p className="text-[11px] text-[#9BAFCB] mt-1 leading-relaxed">
                  If money is fraudulently debited, immediately dial National Cyber Helpline <strong>1930</strong> to freeze fraudulent accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. MY REPORTS SECTION                                                */}
      {/* ==================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#17365C]/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">My Submitted Reports</h2>
              <p className="text-xs text-[#9BAFCB] mt-0.5">
                Track status and review campus administrative updates for non-anonymous submissions.
              </p>
            </div>
            <button
              onClick={loadReports}
              disabled={loadingReports}
              className="px-3 py-1.5 rounded-lg border border-[#17365C] bg-[#061830] hover:bg-[#071F3D] text-xs text-white transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Anonymous Report Status Tracker Form */}
          <div className="p-4 rounded-xl bg-[#061830] border border-[#17365C] space-y-3">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span>Track an Anonymous Report</span>
              </h3>
              <p className="text-[11px] text-[#9BAFCB] mt-0.5">
                Submitted an anonymous report? Enter your Report ID (e.g. REP-2026-XXXXX) below to check review progress confidentially.
              </p>
            </div>

            <form onSubmit={handleTrackReport} className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="REP-2026-XXXXX"
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#020B1A] border border-[#17365C] text-xs font-mono text-white placeholder-slate-500 uppercase focus:outline-none focus:border-[#00D9FF]"
              />
              <button
                type="submit"
                disabled={trackingLoading || !trackingCodeInput.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-[#020B1A] font-bold text-xs transition disabled:opacity-50"
              >
                {trackingLoading ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {trackingError && (
              <p className="text-xs text-rose-400">{trackingError}</p>
            )}

            {trackedReport && (
              <div className="p-3.5 rounded-lg bg-[#020B1A] border border-[#00D9FF]/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#00D9FF]">{trackedReport.report_code}</span>
                  {trackedReport.status && getStatusBadge(trackedReport.status as SafetyReportStatus)}
                </div>
                <p className="font-medium text-white">{trackedReport.subject}</p>
                <p className="text-[11px] text-[#9BAFCB]">
                  Category: <span className="text-slate-300">{trackedReport.category}</span> • Submitted: {new Date(trackedReport.created_at || '').toLocaleDateString()}
                </p>
                {trackedReport.action_summary && (
                  <div className="mt-2 p-2 rounded bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200">
                    <strong>Action Update:</strong> {trackedReport.action_summary}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student's Personal Submitted Reports Table */}
          {loadingReports ? (
            <div className="p-8 text-center text-xs text-[#9BAFCB] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#00D9FF]" />
              <span>Loading report history...</span>
            </div>
          ) : myReports.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#061830] border border-[#17365C] text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#020B1A] border border-[#17365C] text-[#9BAFCB] flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#9BAFCB]">
                No reports submitted yet. If you encounter any campus safety or ragging concerns, you can submit a confidential or anonymous report anytime.
              </p>
              <button
                onClick={() => setActiveTab('report')}
                className="px-4 py-2 rounded-xl bg-[#00D9FF] text-[#020B1A] text-xs font-bold hover:bg-[#00D9FF]/90 transition"
              >
                Report an Issue
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#17365C] bg-[#061830]">
              <table className="w-full text-left text-xs text-[#F4F7FF]">
                <thead className="bg-[#020B1A] text-[#9BAFCB] font-medium border-b border-[#17365C]">
                  <tr>
                    <th className="py-3 px-4">Report ID</th>
                    <th className="py-3 px-4">Issue Category</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17365C]/60">
                  {myReports.map((report) => (
                    <tr key={report.id} className="hover:bg-[#071F3D]/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#00D9FF]">
                        {report.report_code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-300">
                        {report.category}
                      </td>
                      <td className="py-3 px-4 text-white truncate max-w-xs">
                        {report.subject}
                      </td>
                      <td className="py-3 px-4 text-[#9BAFCB]">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-2.5 py-1 rounded bg-[#071F3D] hover:bg-[#0C2D56] text-[#00D9FF] border border-[#17365C] text-xs transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Details Modal */}
          {selectedReport && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-2xl bg-[#061830] border border-[#17365C] p-5 text-xs text-[#F4F7FF] space-y-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#17365C]/60 pb-3">
                  <div>
                    <span className="font-mono text-xs text-[#00D9FF] font-bold">
                      {selectedReport.report_code}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      {selectedReport.subject}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-1 rounded-lg text-[#9BAFCB] hover:text-white hover:bg-[#071F3D] transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-[#020B1A] border border-[#17365C]/60">
                    <span className="text-[#9BAFCB]">Category:</span>
                    <p className="font-medium text-white mt-0.5">{selectedReport.category}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020B1A] border border-[#17365C]/60">
                    <span className="text-[#9BAFCB]">Status:</span>
                    <div className="mt-0.5">{getStatusBadge(selectedReport.status)}</div>
                  </div>
                </div>

                <div>
                  <span className="text-[#9BAFCB] font-medium">Description:</span>
                  <div className="mt-1.5 p-3 rounded-lg bg-[#020B1A] border border-[#17365C]/60 text-slate-200 leading-relaxed max-h-40 overflow-y-auto">
                    {selectedReport.description}
                  </div>
                </div>

                {selectedReport.attachment_name && (
                  <div>
                    <span className="text-[#9BAFCB] font-medium">Attachment:</span>
                    <div className="mt-1 flex items-center gap-2 p-2 rounded-lg bg-[#020B1A] border border-[#17365C]/60">
                      <Paperclip className="w-3.5 h-3.5 text-[#00D9FF]" />
                      <span className="truncate text-white">{selectedReport.attachment_name}</span>
                    </div>
                  </div>
                )}

                {selectedReport.action_summary ? (
                  <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/40">
                    <span className="font-semibold text-cyan-300">Action Taken / Resolution Summary:</span>
                    <p className="mt-1 text-cyan-100 leading-relaxed">
                      {selectedReport.action_summary}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-[#020B1A]/80 border border-[#17365C]/40 text-[11px] text-[#9BAFCB]">
                    Report is currently in queue. Internal actions and updates from campus authorities will appear here once reviewed.
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-1.5 rounded-lg bg-[#071F3D] hover:bg-[#0C2D56] text-white transition text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
