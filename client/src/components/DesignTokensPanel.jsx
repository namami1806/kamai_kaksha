import React from 'react';

/**
 * DesignTokensPanel: Visual showcase of Kamai Kaksha palette tokens, typography, and contrast verification
 */
export default function DesignTokensPanel() {
  const tokens = [
    { name: 'butter', hex: '#FBE7A1', role: 'Skill level & highlight tiles', text: '#1F2540', ratio: '12.3 : 1', compliance: 'WCAG AAA' },
    { name: 'lavender', hex: '#E4D8FA', role: 'Projected earnings & stats', text: '#1F2540', ratio: '11.0 : 1', compliance: 'WCAG AAA' },
    { name: 'leaf', hex: '#A8D26B', role: 'Social proof & village community', text: '#1F2540', ratio: '8.8 : 1', compliance: 'WCAG AAA' },
    { name: 'rose', hex: '#E8A6D8', role: 'XP sprout & streak progress', text: '#1F2540', ratio: '7.9 : 1', compliance: 'WCAG AAA' },
    { name: 'sky', hex: '#8EC5F2', role: 'Kamu coach & guidance tile', text: '#1F2540', ratio: '8.9 : 1', compliance: 'WCAG AAA' },
    { name: 'ink', hex: '#1F2540', role: 'Primary typography & deep contrast', text: '#FFFFFF', ratio: '14.8 : 1', compliance: 'WCAG AAA' },
    { name: 'primary', hex: '#4A5AE8', role: 'Primary action buttons (darkened)', text: '#FFFFFF', ratio: '5.4 : 1', compliance: 'WCAG AA' },
    { name: 'coin gold', hex: '#F5B82E', role: 'Wallet balance, diya flame, earnings', text: '#1F2540', ratio: '8.3 : 1', compliance: 'WCAG AAA' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-6 rounded-28 bg-white border border-black/10 shadow-bento space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-black/5">
        <div>
          <h2 className="text-xl font-black font-display text-ink flex items-center gap-2">
            <span>🎨 Design System & Palette Tokens</span>
          </h2>
          <p className="text-xs text-ink font-semibold mt-0.5">
            Modern consumer-wellness case study style with original village-grounded motifs.
          </p>
        </div>
        <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          All Tokens WCAG AA / AAA Certified
        </span>
      </div>

      {/* Grid of Palette Tokens */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {tokens.map((token) => (
          <div
            key={token.name}
            className="p-4 rounded-2xl flex flex-col justify-between border shadow-xs transition-transform hover:scale-[1.02]"
            style={{ 
              backgroundColor: token.hex, 
              color: token.text,
              borderColor: 'rgba(31,37,64,0.15)' 
            }}
          >
            <div>
              <span className="text-xs font-mono font-black uppercase tracking-wider block opacity-85">
                {token.hex}
              </span>
              <h4 className="text-base font-black capitalize font-display mt-0.5">
                {token.name}
              </h4>
            </div>
            <div className="mt-4 pt-2 border-t border-black/10 flex items-center justify-between">
              <span className="text-[11px] font-black">
                {token.ratio}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-black/10">
                {token.compliance}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Typography Preview */}
      <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-ink/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold text-ink/70 uppercase">
            Headlines & Stats Typography
          </span>
          <p className="text-lg font-black font-display text-ink">
            Baloo 2 / Poppins ExtraBold (Rounded Display)
          </p>
        </div>
        <div>
          <span className="text-[11px] font-mono font-bold text-ink/70 uppercase">
            Regional Dialect Typography
          </span>
          <p className="text-lg font-bold text-ink">
            Noto Sans Devanagari (हिंदी / मगही)
          </p>
        </div>
      </div>
    </div>
  );
}
