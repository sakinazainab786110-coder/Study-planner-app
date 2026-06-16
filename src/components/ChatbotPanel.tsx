import React, { useState, useEffect, useRef } from 'react';
import { Subject, Task, PomodoroLog } from '../types';
import { MessageSquare, x, Send, Sparkles, X, User, ShieldAlert } from 'lucide-react';

interface ChatbotPanelProps {
  subjects: Subject[];
  tasks: Task[];
  pomodoroLogs: PomodoroLog[];
  currentStreak: number;
}

interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: Date;
}

export default function ChatbotPanel({
  subjects,
  tasks,
  pomodoroLogs,
  currentStreak
}: ChatbotPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize with a friendly welcome coach message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'coach',
          text: `Hi Sakina! I'm your Study Coach and study-balance analyzer. Ask me anything like:
- "What should I focus on today?"
- "How are my academic exam deadlines?"
- "Brief summary of my stats."`,
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // auto scroll down when bubble opens/receives texts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const generateAnalyzeResponse = (query: string): string => {
    const q = query.toLowerCase();
    const todayStr = new Date('2026-06-16T12:00:00').toISOString().split('T')[0];

    // Check Streak issues
    if (q.includes('streak') || q.includes('consecutive') || q.includes('days')) {
      if (currentStreak < 3) {
        return `Your current streak is at ${currentStreak} day(s). Remember, studying consecutive days build neural habits! Log at least one Pomodoro session today to raise index.`;
      } else {
        return `Fantastic momentum! You have maintained a ${currentStreak}-day consecutive study streak. Keep it active by logging just 25 minutes of focus today. Keep up the clean work, Sakina!`;
      }
    }

    // Check Study subjects recommendations
    if (q.includes('study') || q.includes('focus') || q.includes('what to') || q.includes('review') || q.includes('next')) {
      const pending = tasks.filter(t => !t.completed);
      if (pending.length > 0) {
        // Sort by difficulty/due
        const highTask = pending.sort((a,b) => b.difficulty - a.difficulty)[0];
        const subName = subjects.find(s => s.id === highTask.subjectId)?.name || 'subject';
        return `Analyzing high-importance benchmarks... I recommend studying "${subName}" by working on your highest difficulty task: "${highTask.title}" which has a target rating of ${highTask.difficulty} stars.`;
      } else if (subjects.length > 0) {
        return `You have completed all pending task cards! Routine chapter reviews of "${subjects[0].name}" or summary writing are optimal to safeguard retention.`;
      } else {
        return `Please add some study subjects and syllabus chapters first inside the Subjects tab so I can map your pathway!`;
      }
    }

    // Check Exam deadline proximity checks
    if (q.includes('exam') || q.includes('deadline') || q.includes('dates') || q.includes('proximity')) {
      const examSubjects = subjects.filter(s => !!s.examDate).map(sub => {
        const diffDays = Math.ceil((new Date(sub.examDate!).getTime() - new Date('2026-06-16T12:00:00').getTime()) / (1000 * 60 * 60 * 24));
        return { name: sub.name, days: diffDays, date: sub.examDate };
      });

      if (examSubjects.length === 0) {
        return `You haven't scheduled any exam dates yet. Go to Subjects -> Edit to set targeted exams, and I will track countdown margins for you.`;
      }

      let answer = `Academic examinations syllabus calendars:\n`;
      let soonCount = 0;
      examSubjects.forEach(item => {
        if (item.days > 0) {
          answer += `• ${item.name}: ${item.days} days remaining (Target: ${item.date})\n`;
          if (item.days <= 3) soonCount++;
        }
      });

      if (soonCount > 0) {
        answer += `\n🚨 ALERT: You have an exam in less than 3 days! Prioritize high-focus blocks and mock review sheets right away.`;
      }
      return answer;
    }

    // Check status metrics
    if (q.includes('stats') || q.includes('hours') || q.includes('progress') || q.includes('academic')) {
      const totalHours = parseFloat((pomodoroLogs.reduce((sum, l) => sum + l.duration, 0) / 60).toFixed(1));
      const closedCount = tasks.filter(t => t.completed).length;
      return `Here is a summary of your Academic Profile of 2026:
- Total Time Logged: ${totalHours} hours
- Tasks checked off: ${closedCount} of ${tasks.length}
- Hot Streak: ${currentStreak} days consecutive
- Registered Subjects: ${subjects.length}`;
    }

    // Conversational fallbacks
    return `Interesting point! I suggest prioritizing your planned syllabus chapters. If you feel stuck, use the Pomodoro Timer tab for a lightweight 25-minute study focus interval. You got this, Sakina!`;
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate rule-based response after short delay of 800ms
    setTimeout(() => {
      const coachText = generateAnalyzeResponse(text);
      const coachMsg: Message = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: coachText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, coachMsg]);
      setIsTyping(false);
    }, 800);
  };

  const quickQuestions = [
    'What should I study next?',
    'Show my countdown alert',
    'How is my streak score?',
    'Audit statistics overview'
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end" id="study-coach-bubble-portal">
      {/* Expanded chat window panel */}
      {isOpen ? (
        <div className="w-[330px] md:w-[360px] h-[450px] bg-white dark:bg-maroon-950 rounded-3xl shadow-2xl border border-maroon-800/10 flex flex-col justify-between overflow-hidden animate-slideUp mb-3.5">
          {/* Header */}
          <div className="bg-maroon-800 text-[#FFF5EE] p-4 flex items-center justify-between border-b border-maroon-900 shadow-sm relative shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="bg-peach-400 p-1.5 rounded-lg text-maroon-900 border border-peach-300">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black font-display tracking-tight text-white leading-tight">AI Study Coach</h4>
                <p className="text-[10px] text-[#FFCBA4] font-medium leading-none">Diagnostic Analytics Expert</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-peach-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Dialog Bubble list */}
          <div className="flex-1 bg-cream/20 p-4 overflow-y-auto space-y-3.5" ref={scrollRef}>
            {messages.map((m) => {
              const isCoach = m.sender === 'coach';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[85%] ${isCoach ? 'float-left mr-auto' : 'float-right ml-auto flex-row-reverse'}`}
                >
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold shadow-2xs ${
                    isCoach ? 'bg-maroon-800 text-peach-300' : 'bg-peach-400 text-maroon-900 border border-maroon-800/20'
                  }`}>
                    {isCoach ? 'AI' : <User size={12} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    isCoach 
                      ? 'bg-white border border-maroon-850/5 text-maroon-950 font-medium' 
                      : 'bg-maroon-800 text-[#FFF5EE]'
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2.5 max-w-[85%] float-left mr-auto">
                <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold bg-maroon-800 text-peach-300 shadow-2xs">
                  AI
                </div>
                <div className="p-3 bg-white border border-maroon-850/5 rounded-2xl flex items-center gap-1.5 shadow-2xs text-xs text-maroon-800 font-bold italic">
                  Coach is analyzing data
                  <span className="flex gap-0.5 mt-0.5">
                    <span className="w-1 h-1 bg-maroon-900 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1 h-1 bg-maroon-900 rounded-full animate-bounce delay-200"></span>
                    <span className="w-1 h-1 bg-maroon-900 rounded-full animate-bounce delay-300"></span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick choices list */}
          {messages.length < 5 && (
            <div className="px-4 py-2 border-t border-maroon-850/5 flex flex-wrap gap-1.5 bg-white shrink-0">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-[9.5px] font-bold text-maroon-800 border-b border-dashed border-maroon-800/40 hover:border-maroon-800 pr-1 pb-0.5 cursor-pointer transition text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input text actions bar */}
          <div className="p-3 border-t border-maroon-850/10 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              placeholder="Ask Coach something..."
              className="flex-1 p-2 border border-maroon-800/10 rounded-xl text-xs bg-cream/20 text-maroon-900 focus:outline-none focus:border-maroon-800 pr-1 pl-2.5"
            />
            <button
              onClick={() => handleSend(inputValue)}
              className="bg-maroon-800 text-white p-2.5 rounded-xl cursor-pointer hover:bg-maroon-900 transition shrink-0"
              title="Send reply"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Circular float toggle trigger button */
        <button
          onClick={() => {
            setIsOpen(true);
          }}
          className="bg-maroon-800 text-[#FFF5EE] w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 hover:bg-maroon-900 relative cursor-pointer group border-2 border-peach-400 transition duration-200"
          title="Open Coach Helper"
          id="chatbot-floating-trigger"
        >
          <MessageSquare size={22} className="text-[#FFF5EE]" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-peach-400 text-maroon-900 border border-maroon-800 text-[8.5px] font-black rounded-full flex items-center justify-center animate-bounce">
            !
          </span>
        </button>
      )}
    </div>
  );
}
