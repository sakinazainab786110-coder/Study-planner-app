import React, { useState } from 'react';
import { Subject, SrsItem } from '../types';
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  X, 
  RotateCcw, 
  HelpCircle, 
  ArrowRight, 
  Plus, 
  Calendar,
  Layers,
  Check
} from 'lucide-react';

interface SrsReviewerProps {
  subjects: Subject[];
  srsItems: SrsItem[];
  onUpdateSrsItems: (items: SrsItem[]) => void;
  onAwardXp: (amount: number, reason: string) => void;
  onShowToast: (text: string, type: 'success' | 'info' | 'warning') => void;
}

export default function SrsReviewer({
  subjects,
  srsItems,
  onUpdateSrsItems,
  onAwardXp,
  onShowToast
}: SrsReviewerProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'all' | 'add'>('review');
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id || '');
  
  // Flashcard review state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isAnswerShown, setIsAnswerShown] = useState(false);

  // Filter due items
  const todayStr = new Date('2026-06-16T12:00:00').toISOString().split('T')[0];

  const dueItems = srsItems.filter(item => item.nextReviewDate <= todayStr);
  const upcomingItems = srsItems.filter(item => item.nextReviewDate > todayStr);

  const getSubjectName = (subId: string) => {
    const s = subjects.find(sub => sub.id === subId);
    return s ? s.name : 'General Subject';
  };

  const getSubjectColor = (subId: string) => {
    const s = subjects.find(sub => sub.id === subId);
    return s ? s.color : '#800020';
  };

  const calculateSm2 = (item: SrsItem, rating: number): SrsItem => {
    let ef = item.easinessFactor;
    let repetitions = item.repetitions;
    let interval = item.interval;

    if (rating < 3) {
      // Recall failed: reset repetitions, set interval to 1 day
      repetitions = 0;
      interval = 1;
    } else {
      // Recall succeeded
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ef);
      }
      repetitions += 1;
    }

    // Adjust Easiness Factor
    // EF' = EF + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
    ef = ef + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (ef < 1.3) ef = 1.3; // Floor capped at 1.3

    // Next review date = today + interval days
    const nextDate = new Date('2026-06-16T12:00:00');
    nextDate.setDate(nextDate.getDate() + interval);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    return {
      ...item,
      easinessFactor: parseFloat(ef.toFixed(2)),
      interval,
      repetitions,
      nextReviewDate: nextDateStr,
      lastReviewedDate: todayStr
    };
  };

  const handleRateRecall = (item: SrsItem, rating: number) => {
    const updated = calculateSm2(item, rating);
    const newItemsList = srsItems.map(i => i.id === item.id ? updated : i);
    onUpdateSrsItems(newItemsList);

    // Award XP based on rating
    const xpRewarded = 5 + rating * 2; // rate perfect recall -> +15 XP!
    onAwardXp(xpRewarded, `SRS review rating: ${rating}/5`);
    
    onShowToast(`SM-2 configured. Next review in ${updated.interval} days (${updated.nextReviewDate})`, 'success');

    // Proceed to next card
    setIsAnswerShown(false);
    if (reviewIndex >= dueItems.length - 1) {
      setReviewIndex(0); // reset if finished
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSubjectId) {
      onShowToast('Please fill out card prompt content', 'warning');
      return;
    }

    const newItem: SrsItem = {
      id: `srs-${Date.now()}`,
      title: newTitle.trim(),
      subjectId: newSubjectId,
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: todayStr
    };

    onUpdateSrsItems([...srsItems, newItem]);
    setNewTitle('');
    onShowToast('SRS card successfully inserted into Active review list!', 'success');
    setActiveTab('review');
  };

  const getUrgencyBadge = (nextReviewDateString: string) => {
    if (nextReviewDateString < todayStr) {
      return <span className="text-[10px] bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full font-bold uppercase">Overdue</span>;
    } else if (nextReviewDateString === todayStr) {
      return <span className="text-[10px] bg-peach-100 text-maroon-800 px-2.5 py-0.5 rounded-full font-bold uppercase">Due Today</span>;
    } else {
      return <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase">Upcoming</span>;
    }
  };

  return (
    <div className="space-y-5" id="srs-reviewer-panel">
      {/* Tab Switch header */}
      <div className="flex bg-[#FFF5EE] p-1.5 rounded-2xl w-full border border-maroon-800/10">
        <button
          onClick={() => { setActiveTab('review'); setIsAnswerShown(false); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'review' 
              ? 'bg-maroon-800 text-white shadow-sm' 
              : 'text-maroon-800/60 hover:text-maroon-800'
          }`}
        >
          <Layers size={14} />
          Active Deck ({dueItems.length} Due)
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'all' 
              ? 'bg-maroon-800 text-white shadow-sm' 
              : 'text-maroon-800/60 hover:text-maroon-800'
          }`}
        >
          <BookOpen size={14} />
          Full Registry ({srsItems.length})
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'add' 
              ? 'bg-maroon-800 text-white shadow-sm' 
              : 'text-maroon-800/60 hover:text-maroon-800'
          }`}
        >
          <Plus size={14} />
          Add Card
        </button>
      </div>

      {/* Review view */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          {dueItems.length > 0 ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-maroon-800/10 flex flex-col items-center text-center">
              <span className="text-[10px] uppercase font-bold text-maroon-800/60 tracking-wider">
                CARD {reviewIndex + 1} OF {dueItems.length} • STAGE REP: {dueItems[reviewIndex].repetitions}
              </span>

              <div className="mt-6 mb-8 w-full max-w-md">
                {/* Subject capsule header */}
                <div className="flex justify-center mb-3">
                  <span 
                    className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider text-white" 
                    style={{ backgroundColor: getSubjectColor(dueItems[reviewIndex].subjectId) }}
                  >
                    {getSubjectName(dueItems[reviewIndex].subjectId)}
                  </span>
                </div>

                {/* Flip Card Stage */}
                <div className="bg-cream border border-maroon-800/10 rounded-2xl p-6 min-h-[160px] flex flex-col justify-center items-center shadow-2xs relative">
                  <p className="text-base font-bold text-maroon-950 leading-relaxed max-w-xs">
                    {dueItems[reviewIndex].title}
                  </p>
                  
                  {isAnswerShown && (
                    <div className="mt-4 pt-4 border-t border-maroon-800/10 w-full text-xs text-maroon-800 font-semibold leading-relaxed">
                      💡 Subject notes content can be recalled here. Keep memory focused on formulas or chronologies.
                      <p className="font-mono text-[9px] text-maroon-800/60 mt-2">
                        Last interval: {dueItems[reviewIndex].interval}d • EF: {dueItems[reviewIndex].easinessFactor}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!isAnswerShown ? (
                <button
                  type="button"
                  onClick={() => setIsAnswerShown(true)}
                  className="w-full max-w-sm bg-peach-400 hover:bg-peach-500 text-maroon-800 p-3.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition transform hover:scale-102"
                >
                  Show Answer Prompt
                </button>
              ) : (
                <div className="w-full max-w-lg space-y-4">
                  <p className="text-xs font-bold text-maroon-800/70">How perfectly did you recall this topic?</p>
                  
                  {/* SM-2 Recall Ratings click row */}
                  <div className="grid grid-cols-6 gap-2">
                    {[0, 1, 2, 3, 4, 5].map((rating) => {
                      const labels = ['Blank', 'Forgot', 'Barely', 'OK', 'Good', 'Perfect'];
                      return (
                        <button
                          key={rating}
                          onClick={() => handleRateRecall(dueItems[reviewIndex], rating)}
                          className="bg-cream hover:bg-maroon-800 hover:text-white p-2.5 rounded-2xl flex flex-col items-center justify-between border border-maroon-800/10 cursor-pointer transition text-maroon-800 group duration-150"
                        >
                          <span className="text-base font-black group-hover:scale-110">{rating}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider scale-90 md:scale-100 opacity-70 mt-1">{labels[rating]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-maroon-800/5 shadow-sm text-center flex flex-col items-center justify-center">
              <div className="bg-peach-100 p-4 rounded-full text-maroon-800 mb-4 animate-bounce">
                <Check className="stroke-[3]" size={32} />
              </div>
              <h4 className="font-black text-maroon-800 text-lg">SRS Queue is Empty!</h4>
              <p className="text-xs text-maroon-800/60 max-w-sm mt-1 leading-relaxed">
                Outstanding work! You have finished all active concept revisions. Add new flashcards or take short break focus intervals.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Registry overview */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-3xl border border-maroon-800/10 p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-maroon-800/5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-maroon-800">Review Items List ({srsItems.length})</h4>
            <span className="text-[10px] font-mono text-maroon-800/50">Next scheduled sessions shown</span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {srsItems.map((item) => (
              <div 
                key={item.id}
                className="p-3 bg-cream/50 rounded-2xl border border-maroon-800/5 hover:bg-cream transition flex items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span 
                      className="text-[9px] font-black px-2 py-0.5 rounded-md text-white uppercase"
                      style={{ backgroundColor: getSubjectColor(item.subjectId) }}
                    >
                      {getSubjectName(item.subjectId)}
                    </span>
                    {getUrgencyBadge(item.nextReviewDate)}
                  </div>
                  <h5 className="text-xs font-bold text-maroon-950 truncate leading-snug">{item.title}</h5>
                  <p className="text-[9px] text-maroon-800/50 font-mono mt-0.5">
                    Interval: {item.interval} days • EF: {item.easinessFactor} • Reps: {item.repetitions}
                  </p>
                </div>
                
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-maroon-800 block">Due Date</span>
                  <span className="text-[10px] font-mono text-maroon-800/60">{item.nextReviewDate}</span>
                </div>
              </div>
            ))}

            {srsItems.length === 0 && (
              <p className="text-xs text-center text-maroon-800/50 py-6">No spaced repetition cards saved. Add a few to start reviewing!</p>
            )}
          </div>
        </div>
      )}

      {/* Add View */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-3xl border border-maroon-800/10 p-6 shadow-sm">
          <h4 className="font-bold text-sm text-maroon-800 mb-4 uppercase tracking-wider">Create Spaced Repetition card</h4>
          <form onSubmit={handleAddNewItem} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-maroon-800/70 block">Review Question/Concept prompt</label>
              <textarea
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Fundamental Theorem of Calculus equations"
                className="w-full border border-maroon-800/20 rounded-xl p-3 text-xs bg-cream/30 focus:outline-none focus:border-maroon-800 focus:bg-white text-maroon-900"
                rows={3}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-maroon-800/70 block">Associated Study Subject</label>
              <select
                value={newSubjectId}
                onChange={(e) => setNewSubjectId(e.target.value)}
                className="w-full border border-maroon-800/20 rounded-xl p-3 text-xs bg-white text-maroon-900 focus:outline-none focus:border-maroon-800"
                required
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-maroon-800 hover:bg-maroon-900 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Plus size={14} /> Add Card to Deck
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
