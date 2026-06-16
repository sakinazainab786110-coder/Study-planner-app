import React from 'react';
import { Subject, Task } from '../types';
import { getSmartRecommendations } from '../utils';
import { Sparkles, ArrowRight, Lightbulb, Star } from 'lucide-react';

interface RecommendationsProps {
  subjects: Subject[];
  tasks: Task[];
  onNavigateToTimer: (subjId: string) => void;
}

export default function Recommendations({
  subjects,
  tasks,
  onNavigateToTimer,
}: RecommendationsProps) {
  const recommendations = getSmartRecommendations(subjects, tasks);

  if (subjects.length === 0) return null;

  return (
    <div className="bg-peach-100/70 border border-peach-300 p-4.5 rounded-xl animate-fadeIn relative overflow-hidden" id="smart-recommendations-banner">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-peach-200/40 rounded-full blur-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-20 h-20 bg-maroon-100/20 rounded-full blur-lg pointer-events-none" />

      <div className="flex items-start gap-3 relative z-10">
        <div className="bg-maroon-800 p-2.5 rounded-lg text-peach-300 shrink-0 self-start sm:self-auto">
          <Sparkles className="animate-pulse" size={18} />
        </div>
        
        <div className="space-y-3 flex-1 min-w-0">
          <div>
            <h3 className="font-bold text-maroon-900 text-sm tracking-tight flex items-center gap-1.5 font-display">
              AI Intelligent Study Target Recommender
              <span className="text-[10px] bg-maroon-800 text-white font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">Algorithm Active</span>
            </h3>
            <p className="text-xs text-maroon-950 font-medium">
              We parsed your pending micro-tasks, syllabus milestones, and exam countdowns. Here is your optimal study directive for today:
            </p>
          </div>

          {/* List items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {recommendations.map((rec, i) => (
              <div 
                key={rec.subject.id} 
                className="bg-white/80 hover:bg-white p-3 rounded-lg border border-peach-250 flex flex-col justify-between transition-colors shadow-2xs group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className="text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{ backgroundColor: `${rec.subject.color}15`, color: rec.subject.color }}
                    >
                      {rec.subject.name}
                    </span>
                    <span className="text-[10px] bg-maroon-50 text-maroon-800 font-mono font-bold px-1 py-0.2 rounded flex items-center gap-0.5 shadow-2xs">
                      <Star size={8} fill="#800020" className="text-[#800020]" />
                      Urgency {rec.urgencyScore}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-gray-800 mt-1">{rec.reason}</p>
                </div>

                <div className="flex justify-end pt-3">
                  <button 
                    onClick={() => onNavigateToTimer(rec.subject.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-maroon-800 hover:text-maroon-900 border-b border-dashed border-maroon-800 hover:border-maroon-900 pb-0.5 cursor-pointer"
                  >
                    Load focus timer
                    <ArrowRight size={10} className="transform group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
