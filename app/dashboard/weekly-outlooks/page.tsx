import { Lock, TrendingUp } from 'lucide-react'

const previewOutlooks = [
  { title: 'Weekly Outlook — Week 21', traders: ['Trader One', 'Trader Two'], markets: ['Gold', 'DXY', 'NASDAQ'] },
  { title: 'Weekly Outlook — Week 20', traders: ['Trader One', 'Trader Three'], markets: ['EUR/USD', 'GBP/JPY', 'Gold'] },
  { title: 'Monthly Bias — May 2026', traders: ['Full Team'], markets: ['All Major Pairs'] },
  { title: 'Weekly Outlook — Week 19', traders: ['Trader Two', 'Trader Four'], markets: ['S&P 500', 'BTC', 'Indices'] },
]

export default function WeeklyOutlooksPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={13} className="text-[#c9a84c]" />
          <span className="text-[#c9a84c] text-xs font-medium uppercase tracking-wider">Gold Access Required</span>
        </div>
        <h1 className="text-2xl font-light text-white mb-2">Weekly Outlooks</h1>
        <p className="text-[#5a5a66] text-sm max-w-lg">
          Full team market analysis every week. Know the narrative, the key levels, and the bias before the week begins.
        </p>
      </div>

      {/* Locked banner */}
      <div className="p-6 rounded-2xl bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.2)] mb-8 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center shrink-0">
          <TrendingUp size={18} className="text-[#c9a84c]" />
        </div>
        <div>
          <h3 className="text-white font-medium text-base mb-1.5">Gold access is not open yet.</h3>
          <p className="text-[#5a5a66] text-sm leading-relaxed">
            Weekly Outlooks will be available to Gold members. Full team analysis, video breakdowns of all major pairs, and a clear directional bias for the week ahead. Coming soon.
          </p>
        </div>
      </div>

      {/* Blurred preview grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {previewOutlooks.map((item, i) => (
          <div key={i} className="relative rounded-2xl card overflow-hidden">
            {/* Blurred background */}
            <div className="locked-blur p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[rgba(201,168,76,0.3)]" />
                <span className="text-[#5a5a66] text-xs">Weekly Outlook</span>
              </div>
              <div className="aspect-video bg-[rgba(201,168,76,0.03)] rounded-xl mb-3 flex items-center justify-center">
                <TrendingUp size={24} className="text-[rgba(201,168,76,0.2)]" />
              </div>
              <h3 className="text-[#8e8e9a] font-medium text-sm mb-1">{item.title}</h3>
              <p className="text-[#5a5a66] text-xs">{item.traders.join(', ')}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {item.markets.map(m => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.04)] text-[#5a5a66]">{m}</span>
                ))}
              </div>
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,10,11,0.5)] backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-2">
                <Lock size={16} className="text-[#c9a84c]" />
                <span className="text-[#c9a84c] text-xs font-medium">Gold Access</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
