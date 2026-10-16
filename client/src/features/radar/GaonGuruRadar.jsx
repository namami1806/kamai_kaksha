import React, { useState, useEffect } from 'react';
import MascotKamu from '../../components/MascotKamu';
import { useTranslation } from '../../lib/i18n';
import { 
  Compass, 
  MapPin, 
  Briefcase, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Coins, 
  Sparkles,
  ExternalLink,
  Filter
} from 'lucide-react';

export default function GaonGuruRadar({ onBack }) {
  const { t, lang } = useTranslation();
  const [radarData, setRadarData] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:5001/api/radar/jobs?studentId=priya_17&district=Gaya&block=Tekari')
      .then(res => res.json())
      .then(data => {
        setRadarData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.warn('Failed to load radar data:', err);
        setIsLoading(false);
      });
  }, []);

  const handleApply = (jobId) => {
    setAppliedJobs(prev => new Set([...prev, jobId]));
  };

  const matches = radarData?.topMatches || [];
  const filteredMatches = selectedBlock === 'All' 
    ? matches 
    : matches.filter(m => m.block.toLowerCase().includes(selectedBlock.toLowerCase()));

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={onBack}
          className="min-h-[44px] px-4 py-2 rounded-full bg-white text-ink border border-ink/15 text-xs font-bold hover:bg-[#F2F4FC] transition-all flex items-center gap-1.5 shadow-xs"
        >
          <span>← Back to Credential</span>
        </button>

        <span className="text-[10px] font-mono font-bold text-ink/60 bg-white px-3 py-1 rounded-full border border-ink/10 shadow-xs">
          Rules-Based Matcher • Gaya District
        </span>
      </div>

      {/* Hero Radar Header Card */}
      <div className="bg-white rounded-32 border border-black/10 p-5 sm:p-7 shadow-bento space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                गांव गुरु • Gaon Guru Local Job Radar
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Skill-Match Engine
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black font-display text-ink mt-1">
              Gaya District Local Opportunities Radar
            </h1>
            <p className="text-xs text-ink/70 font-medium">
              Matched against Priya's verified skills in Solar PV Mounting, DC Inverter Wiring, and Multimeter Diagnostics
            </p>
          </div>

          <div className="animate-float">
            <MascotKamu state="coach" size={85} />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-ink/60 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Block:
          </span>
          {['All', 'Tekari', 'Bodh Gaya'].map(blk => (
            <button
              key={blk}
              onClick={() => setSelectedBlock(blk)}
              className={`min-h-[36px] px-3.5 py-1 rounded-full font-bold text-xs border transition-all ${
                selectedBlock === blk
                  ? 'bg-ink text-white border-ink shadow-xs'
                  : 'bg-[#F8F9FD] text-ink border-ink/15 hover:bg-butter-light'
              }`}
            >
              {blk}
            </button>
          ))}
        </div>
      </div>

      {/* MATCHED JOBS LIST */}
      <div className="space-y-3">
        {filteredMatches.map(job => {
          const isApplied = appliedJobs.has(job.id);

          return (
            <div
              key={job.id}
              className="bg-white rounded-32 border border-black/10 p-5 sm:p-6 shadow-bento space-y-3 transition-all hover:border-primary/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                      {job.matchPercent}% Match • illustrative sample data
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{job.distanceKm} km ({job.block})</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {job.hubName}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black font-display text-ink pt-0.5">
                    {job.title}
                  </h3>
                  <p className="text-xs text-ink/70 font-medium">
                    {job.demandTrend}
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-[10px] font-black uppercase text-ink/60 block">
                    Avg Monthly Earning • illustrative sample data
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-display text-primary block">
                    ₹{job.averageMonthlyIncome?.toLocaleString('en-IN') || '14,500'}/mo
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    + ₹{Math.round((job.averageMonthlyIncome || 14500) * 0.10)}/mo in Tool Kit Fund
                  </span>
                </div>
              </div>

              {/* Skills matched tags */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-ink/60 block">
                  Matched Competencies:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  {job.requiredSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-[#F6F8FD] border border-ink/10 text-ink text-[11px] font-bold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{sk}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Minor Safe Advisory & Application Action */}
              <div className="border-t border-black/10 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{job.minorAdvisory}</span>
                </div>

                <button
                  onClick={() => handleApply(job.id)}
                  disabled={isApplied}
                  className={`min-h-[44px] px-5 py-2 rounded-full font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                    isApplied
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-primary hover:bg-primary-hover text-white active:scale-95'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Facilitator Contacted • आवेदन भेजा गया</span>
                    </>
                  ) : (
                    <>
                      <span>Apply via Village Facilitator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-ink/60 text-center font-medium">
        Sample job radar modelled on PM Surya Ghar & rural vocational tracks for hackathon evaluation.
      </p>

    </div>
  );
}
