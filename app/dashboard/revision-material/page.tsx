import { Lock, BookMarked, FileText, CheckSquare, Download } from 'lucide-react'
import { mockRevisionMaterials } from '@/lib/mockData'

const typeIcon: Record<string, React.ElementType> = {
  PDF: FileText,
  Checklist: CheckSquare,
  Worksheet: FileText,
  Flashcards: BookMarked,
}

export default function RevisionMaterialPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={13} className="text-[#c9a84c]" />
          <span className="text-[#c9a84c] text-xs font-medium uppercase tracking-wider">Gold Access Required</span>
        </div>
        <h1 className="text-2xl font-light text-white mb-2">Revision Material</h1>
        <p className="text-[#5a5a66] text-sm max-w-lg">
          Notes, cheatsheets, checklists, and downloadable resources from the full team. Available to Gold members.
        </p>
      </div>

      {/* Locked banner */}
      <div className="p-6 rounded-2xl bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.2)] mb-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center shrink-0">
            <BookMarked size={18} className="text-[#c9a84c]" />
          </div>
          <div>
            <h3 className="text-white font-medium text-base mb-1.5">Gold access is not open yet.</h3>
            <p className="text-[#5a5a66] text-sm leading-relaxed max-w-xl">
              All revision materials — PDFs, checklists, flashcards, and worksheets — will be available to Gold members. Download and keep forever.
            </p>
          </div>
        </div>
      </div>

      {/* Material grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockRevisionMaterials.map(item => {
          const Icon = typeIcon[item.type] || FileText
          return (
            <div key={item.id} className="relative rounded-xl card overflow-hidden">
              <div className="locked-blur p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.12)] flex items-center justify-center">
                    <Icon size={16} className="text-[#c9a84c]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#5a5a66] uppercase tracking-wide">{item.type}</span>
                    {item.type === 'PDF' && (
                      <Download size={12} className="text-[#5a5a66]" />
                    )}
                  </div>
                </div>
                <h3 className="text-[#8e8e9a] font-medium text-sm mb-1.5">{item.title}</h3>
                <p className="text-[#5a5a66] text-xs leading-relaxed mb-3">{item.description}</p>
                <span className="text-[#5a5a66] text-[11px]">{item.pages} {item.type === 'Flashcards' ? 'cards' : 'pages'}</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,10,11,0.55)] backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-1.5">
                  <Lock size={14} className="text-[#c9a84c]" />
                  <span className="text-[11px] text-[#c9a84c] font-medium">Gold</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
