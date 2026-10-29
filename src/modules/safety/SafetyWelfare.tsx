import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  HeartHandshake,
  UserCheck,
  BellRing,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { SafetyResource } from '../../types';

export const SafetyWelfare: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<SafetyResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Personal Contact Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SafetyResource['category']>('personal');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // SOS Quick Trigger Feedback
  const [sosActive, setSosActive] = useState(false);

  const loadResources = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiService.getSafetyResources(user.id);
      setResources(data);
    } catch (err) {
      console.error('Error fetching safety resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [user]);

  const handleAddPersonalContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !phone.trim()) return;

    try {
      await apiService.addPersonalSafetyContact(user.id, {
        title: title.trim(),
        category,
        phone: phone.trim(),
        email: email.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        hours: 'Personal Contact',
        is_verified: true,
      });
      setIsModalOpen(false);
      setTitle('');
      setPhone('');
      setEmail('');
      setLocation('');
      setDescription('');
      await loadResources();
    } catch (err) {
      console.error('Error adding personal contact:', err);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Remove this personal contact?')) return;
    try {
      await apiService.deleteSafetyResource(id);
      await loadResources();
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  const triggerSos = () => {
    setSosActive(true);
    // Play alert sound tone using Web Audio API if supported
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio fallback
    }
    setTimeout(() => setSosActive(false), 5000);
  };

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase())) ||
        r.phone.includes(search);
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [resources, search, selectedCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Safety & Welfare
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verified campus emergency helplines, health center contacts, counseling resources, and personal emergency contacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerSos}
            className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition flex items-center gap-2 shadow-2xl ${
              sosActive
                ? 'bg-rose-600 animate-ping'
                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-glow-blue'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>{sosActive ? 'EMERGENCY BEACON ACTIVE' : 'Quick SOS Alert'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl glass-panel text-slate-200 hover:text-cyan-300 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Trusted Contact</span>
          </button>
        </div>
      </div>

      {/* SOS Active Banner */}
      {sosActive && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-100 flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 animate-bounce" />
            <div>
              <p className="font-bold text-sm">Emergency Distress Alert Broadcasted</p>
              <p className="text-xs text-rose-300">
                Contact Campus Security Control immediately: <a href="tel:+919876543210" className="font-mono underline font-bold">+91 98765 43210</a> or call National Hotline <a href="tel:112" className="font-mono underline font-bold">112</a>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSosActive(false)}
            className="p-1 rounded text-rose-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Official Hotlines Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 to-slate-900/80 border border-rose-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-rose-400 font-mono font-bold">
              <span>NATIONAL EMERGENCY</span>
              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">GOVT</span>
            </div>
            <p className="text-2xl font-extrabold text-white font-mono mt-2">112</p>
            <p className="text-[11px] text-slate-400 mt-1">Police, Fire & Ambulance Services</p>
          </div>
          <a
            href="tel:112"
            className="mt-3 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold text-center transition flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Dial 112</span>
          </a>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900/80 border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono font-bold">
              <span>CAMPUS SECURITY HQ</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">24/7 GATE</span>
            </div>
            <p className="text-base font-extrabold text-white font-mono mt-2">+91 98765 43210</p>
            <p className="text-[11px] text-slate-400 mt-1">Main Gate Control & Rapid Patrol</p>
          </div>
          <a
            href="tel:+919876543210"
            className="mt-3 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold text-center transition flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Security</span>
          </a>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900/80 border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-mono font-bold">
              <span>CAMPUS CLINIC & AMBULANCE</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">MEDICAL</span>
            </div>
            <p className="text-base font-extrabold text-white font-mono mt-2">+91 98765 43211</p>
            <p className="text-[11px] text-slate-400 mt-1">Doctor on duty & campus emergency transit</p>
          </div>
          <a
            href="tel:+919876543211"
            className="mt-3 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold text-center transition flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Clinic</span>
          </a>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 to-slate-900/80 border border-violet-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-violet-400 font-mono font-bold">
              <span>COUNSELING & WELLBEING</span>
              <span className="px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300">SUPPORT</span>
            </div>
            <p className="text-base font-extrabold text-white font-mono mt-2">+91 98765 43212</p>
            <p className="text-[11px] text-slate-400 mt-1">Confidential exam stress & mental health</p>
          </div>
          <a
            href="tel:+919876543212"
            className="mt-3 py-1.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold text-center transition flex items-center justify-center gap-1.5"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Connect Counselor</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources, numbers, departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl glass-input"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'emergency', label: 'Emergency' },
            { id: 'medical', label: 'Medical' },
            { id: 'mental_health', label: 'Mental Health' },
            { id: 'helpline', label: 'Helplines' },
            { id: 'personal', label: 'Personal Contacts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === tab.id
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className={`p-5 rounded-2xl glass-panel border transition flex flex-col justify-between ${
              res.is_institutional
                ? 'border-slate-800/80 hover:border-cyan-500/30'
                : 'border-purple-500/30 bg-purple-950/10'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                    res.is_institutional
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                  }`}
                >
                  {res.is_institutional ? 'Institutional Campus Resource' : 'Personal Trusted Contact'}
                </span>

                {res.is_verified && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white mt-1">{res.title}</h3>
              {res.description && (
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{res.description}</p>
              )}

              <div className="mt-3 space-y-1.5 text-xs text-slate-300 font-mono">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <a href={`tel:${res.phone}`} className="text-cyan-300 hover:underline font-bold">
                    {res.phone}
                  </a>
                </div>

                {res.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-400 truncate">{res.email}</span>
                  </div>
                )}

                {res.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-400 truncate">{res.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400">{res.hours}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <a
                href={`tel:${res.phone}`}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>

              {!res.is_institutional && (
                <button
                  onClick={() => handleDeleteContact(res.id)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                  title="Remove Contact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Personal Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl glass-panel border border-cyan-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Add Personal Trusted Contact</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPersonalContact} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Contact Relationship & Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Father (Ramesh Sharma) or Roommate (Vikram)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="guardian@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Location / Residence</label>
                  <input
                    type="text"
                    placeholder="Hostel Room 304"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Primary local emergency contact..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-glow-blue transition"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
