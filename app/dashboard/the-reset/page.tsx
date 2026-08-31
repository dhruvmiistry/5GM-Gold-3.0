'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import {
  getResetModule, getResetProgress, setResetLessonComplete,
  type ResetModuleData, type ResetLessonVideo,
} from '@/lib/data'
import { resetLessons as previewLessons } from '@/lib/mockData'
import { formatDuration } from '@/lib/utils'
import MuxPlayer from '@/components/MuxPlayer'
import { usePostVideoInvitation } from '@/components/mentorCalls/usePostVideoInvitation'
import LaunchCountdown from '@/components/theReset/LaunchCountdown'
import {
  Loader2, RotateCcw, Play, CheckCircle2, Circle, X, Clock, Lock,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

function groupByStage<T extends { stage: string }>(items: T[]) {
  const stages = Array.from(new Set(items.map(i => i.stage)))
  return stages.map(stage => ({ stage, items: items.filter(i => i.stage === stage) }))
}

export default function TheResetPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [module, setModule] = useState<ResetModuleData | null>(null)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [playingLesson, setPlayingLesson] = useState<ResetLessonVideo | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const { dialog: invitationDialog, onVideoEnded, resetGuard } = usePostVideoInvitation()

  const playLesson = (lesson: ResetLessonVideo) => { resetGuard(); setPlayingLesson(lesson) }

  const loadModule = () => getResetModule().then(m => { setModule(m); setLoading(false) })

  useEffect(() => { loadModule() }, [])

  useEffect(() => {
    if (user?.id && module?.id) {
      getResetProgress(user.id, module.id).then(p => setCompletedIds(p.completedVideoIds))
    }
  }, [user?.id, module?.id])

  const lessonIds = useMemo(() => module?.lessons.map(l => l.id) ?? [], [module])
  const completedCount = module ? module.lessons.filter(l => completedIds.includes(l.id)).length : 0
  const hasContent = (module?.lessons.length ?? 0) > 0
  const unlockedCount = module ? module.lessons.filter(l => !l.isLocked).length : 0
  // The curriculum is a fixed 20 lessons — used as the progress denominator
  // so it matches the dashboard hero card even while fewer are linked/live.
  const totalLessonCount = previewLessons.length

  const toggleComplete = async (lesson: ResetLessonVideo) => {
    if (!user?.id || !module?.id) return
    const wasCompleted = completedIds.includes(lesson.id)
    setPendingId(lesson.id)
    // Optimistic update
    setCompletedIds(prev => wasCompleted ? prev.filter(id => id !== lesson.id) : [...prev, lesson.id])
    const result = await setResetLessonComplete(user.id, lesson.id, module.id, lessonIds, !wasCompleted)
    if (!result.success) {
      // Revert on failure
      setCompletedIds(prev => wasCompleted ? [...prev, lesson.id] : prev.filter(id => id !== lesson.id))
    }
    setPendingId(null)
  }

  if (loading) {
    return (
      <div className="dashboard-bg min-h-full flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
      </div>
    )
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-8 md:py-10 space-y-8">

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}
            >
              <RotateCcw size={17} className="text-black" strokeWidth={2} />
            </div>
            <div>
              <p className="section-label">The Reset</p>
              <h1 className="text-[1.5rem] font-light text-white tracking-tight leading-snug">
                Your free trading foundations course
              </h1>
            </div>
          </motion.div>
          <motion.p variants={fadeUp} className="text-[#8e8e9a] text-sm max-w-xl">
            A structured, ordered path from the 5GM mentors — start at lesson one and work through
            at your own pace. No cost, no catch.
          </motion.p>
        </motion.div>

        {/* Launch countdown — shown while the course is still locked */}
        {module?.launchAt && (
          <LaunchCountdown targetIso={module.launchAt} onElapsed={loadModule} />
        )}

        {/* Progress summary — only shown once at least one lesson has unlocked */}
        {hasContent && unlockedCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  {completedCount} of {totalLessonCount} lessons complete
                </span>
                <span className="text-[#c9a84c] text-xs font-mono">
                  {Math.round((completedCount / totalLessonCount) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-[rgba(255,255,255,0.07)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / totalLessonCount) * 100}%`, background: '#c9a84c' }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Content */}
        {hasContent ? (
          <div className="space-y-8">
            {groupByStage(module!.lessons).map((group, gi) => (
              <motion.div key={group.stage}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + gi * 0.06 }}
              >
                <p className="section-label mb-3">{group.stage}</p>
                <div className="space-y-2">
                  {group.items.map(lesson => {
                    const isDone = completedIds.includes(lesson.id)

                    if (lesson.isLocked) {
                      return (
                        <div key={lesson.id}
                          className="flex items-center gap-4 p-4 rounded-2xl"
                          style={{ background: 'rgba(17,17,19,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <Lock size={14} className="text-[#5a5a66]" strokeWidth={1.75} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#8e8e9a] text-sm font-medium leading-snug truncate">{lesson.title}</p>
                            <p className="text-[#5a5a66] text-[11px] mt-1">{lesson.analyst}</p>
                          </div>
                          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full text-[#5a5a66]"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            Locked
                          </span>
                        </div>
                      )
                    }

                    return (
                      <div key={lesson.id}
                        className="flex items-center gap-4 p-4 rounded-2xl card card-gold"
                        style={{ background: 'rgba(17,17,19,0.8)' }}
                      >
                        <button
                          onClick={() => playLesson(lesson)}
                          className="relative w-16 h-11 rounded-xl shrink-0 overflow-hidden flex items-center justify-center transition-all"
                          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.22)' }}
                        >
                          {lesson.thumbnail && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={lesson.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0" style={{ background: lesson.thumbnail ? 'rgba(0,0,0,0.35)' : 'transparent' }} />
                          <Play size={14} className="relative text-[#c9a84c] ml-0.5" strokeWidth={2} />
                        </button>

                        <button onClick={() => playLesson(lesson)} className="flex-1 min-w-0 text-left">
                          <p className="text-white text-sm font-medium leading-snug truncate">{lesson.title}</p>
                          <p className="text-[#5a5a66] text-[11px] mt-1 flex items-center gap-2">
                            <span>{lesson.analyst}</span>
                            {lesson.duration > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock size={9} /> {formatDuration(lesson.duration)}
                              </span>
                            )}
                          </p>
                        </button>

                        <button
                          onClick={() => toggleComplete(lesson)}
                          disabled={pendingId === lesson.id || !user}
                          className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                          style={isDone
                            ? { color: '#4caf7d', background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.25)' }
                            : { color: '#5a5a66', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          {pendingId === lesson.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : isDone ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                          {isDone ? 'Complete' : 'Mark complete'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <ComingSoon />
        )}
      </div>

      {/* Player modal — same pattern as Free Videos */}
      <AnimatePresence>
        {playingLesson && playingLesson.muxPlaybackId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setPlayingLesson(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-4xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-medium text-sm leading-snug">{playingLesson.title}</p>
                  <p className="text-[#5a5a66] text-xs mt-0.5">{playingLesson.analyst}</p>
                </div>
                <button
                  onClick={() => setPlayingLesson(null)}
                  className="ml-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-all shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
              <MuxPlayer playbackId={playingLesson.muxPlaybackId} title={playingLesson.title}
                onEnded={() => { onVideoEnded(playingLesson.id); setPlayingLesson(null) }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {invitationDialog}
    </div>
  )
}

// Honest empty state — no lessons uploaded to Supabase yet. Uses the same
// syllabus titles shown on the public homepage, clearly labeled as a preview
// with no play/progress affordances, since nothing is actually watchable.
function ComingSoon() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(201,168,76,0.18)' }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 60%)' }} />
        <div className="relative flex items-start gap-5 p-6">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(201,168,76,0.09)', border: '1px solid rgba(201,168,76,0.22)' }}>
            <RotateCcw size={18} className="text-[#c9a84c]" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium text-base mb-1.5">Lessons are being uploaded now.</h3>
            <p className="text-[#5a5a66] text-sm leading-relaxed max-w-xl">
              The curriculum below is the planned structure for The Reset. Videos will appear here
              as each one goes live — nothing below is playable yet.
            </p>
          </div>
        </div>
      </motion.div>

      {groupByStage(previewLessons).map((group, gi) => (
        <motion.div key={group.stage}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + gi * 0.06 }}
        >
          <p className="section-label mb-3">{group.stage} · Preview</p>
          <div className="space-y-2">
            {group.items.map(lesson => (
              <div key={lesson.number}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'rgba(17,17,19,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-[#5a5a66] text-xs font-mono"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {String(lesson.number).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#8e8e9a] text-sm font-medium leading-snug truncate">{lesson.title}</p>
                  <p className="text-[#5a5a66] text-[11px] mt-0.5">{lesson.presenter}</p>
                </div>
                <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full text-[#5a5a66]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
