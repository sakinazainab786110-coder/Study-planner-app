import React, { useState } from 'react';
import { Subject, StudyBlock, Priority } from '../types';
import { Plus, Trash2, CalendarRange, Clock, Cpu, HelpCircle, Sparkles } from 'lucide-react';
import { runAutoScheduler } from '../utils';

interface StudySchedulerProps {
  subjects: Subject[];
  studyBlocks: StudyBlock[];
  onAddBlock: (block: Omit<StudyBlock, 'id'>) => void;
  onDeleteBlock: (id: string) => void;
  onOverwriteBlocks: (blocks: StudyBlock[]) => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'warning') => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export default function StudyScheduler({
  subjects,
  studyBlocks,
  onAddBlock,
  onDeleteBlock,
  onOverwriteBlocks,
  onShowToast,
}: StudySchedulerProps) {
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);

  // Manual block form state
  const [subjectId, setSubjectId] = useState('');
  const [day, setDay] = useState('Mon');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [priority, setPriority] = useState<Priority>('Medium');

  // Auto-scheduler form state
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [examDates, setExamDates] = useState<Record<string, string>>({});

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      onShowToast('Please select a subject', 'warning');
      return;
    }
    if (startTime >= endTime) {
      onShowToast('Start time must be earlier than End time', 'warning');
      return;
    }

    onAddBlock({
      subjectId,
      day,
      startTime,
      endTime,
      priority,
    });

    onShowToast('Successfully added study block!', 'success');
    setIsAddingBlock(false);
    // Reset defaults but preserve day or priority
    setSubjectId('');
  };

  const handleAutoRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjects.length === 0) {
      onShowToast('You must create at least one subject first!', 'warning');
      return;
    }

    const confirmRun = window.confirm(
      'This will replace your current weekly schedule with an mathematically optimized plan adjusted to upcoming exams and remaining chapters. Proceed?'
    );

    if (!confirmRun) return;

    // Run Auto Scheduler Algorithm
    const generated = runAutoScheduler(subjects, hoursPerDay, examDates);
    onOverwriteBlocks(generated);
    onShowToast(`Smart Auto-Scheduler generated ${generated.length} optimized sessions!`, 'success');
    setIsAutoScheduling(false);
  };

  const handleExamDateChange = (subId: string, value: string) => {
    setExamDates(prev => ({
      ...prev,
      [subId]: value
    }));
  };

  // Get color styled border or background per priority
  const getPriorityStyle = (pri: Priority) => {
    switch (pri) {
      case 'High':
        return 'bg-maroon-800 text-white border-maroon-950 shadow-xs';
      case 'Medium':
        return 'bg-maroon-600 text-white border-maroon-700';
      case 'Low':
        return 'bg-maroon-100 text-maroon-900 border-maroon-200';
    }
  };

  // Organize blocks by weekday
  const blocksByDay = WEEKDAYS.reduce((acc, currentDay) => {
    acc[currentDay] = studyBlocks
      .filter(b => b.day === currentDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, StudyBlock[]>);

  const getSubjectName = (subId: string) => {
    const s = subjects.find(sub => sub.id === subId);
    return s ? s.name : 'Unknown Subject';
  };

  const getSubjectColor = (subId: string) => {
    const s = subjects.find(sub => sub.id === subId);
    return s ? s.color : '#854d0e';
  };

  return (
    <div className="space-y-6" id="study-scheduler-section">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-maroon-800 tracking-tight flex items-center gap-2">
            <CalendarRange className="text-maroon-800" size={24} />
            Study Week Scheduler
          </h2>
          <p className="text-sm text-gray-500">Plan your calendar manually, or deploy the Intelligent Auto-Scheduler</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              if (subjects.length === 0) {
                onShowToast('Add subjets first to configure exams', 'warning');
                return;
              }
              // Seed examDates standard map
              const initialDates: Record<string, string> = {};
              subjects.forEach(s => {
                initialDates[s.id] = s.examDate || '';
              });
              setExamDates(initialDates);
              setIsAutoScheduling(true);
              setIsAddingBlock(false);
            }}
            className="flex items-center gap-2 bg-peach-100 text-maroon-900 border border-peach-300 hover:bg-peach-200 px-4 py-2.5 rounded-lg font-semibold transition cursor-pointer text-sm shadow-xs"
          >
            <Cpu size={16} className="text-maroon-800 animate-pulse" />
            🤖 Auto-Schedule My Week
          </button>
          
          <button
            onClick={() => {
              setIsAddingBlock(true);
              setIsAutoScheduling(false);
            }}
            className="flex items-center gap-2 bg-maroon-800 hover:bg-maroon-900 text-white px-4 py-2.5 rounded-lg font-medium transition cursor-pointer text-sm shadow-xs"
          >
            <Plus size={16} className="text-peach-400" />
            Manual Block
          </button>
        </div>
      </div>

      {/* Adding Block Form */}
      {isAddingBlock && (
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-maroon-800 animate-fadeIn" id="manual-block-form">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-maroon-800">Add Study Block</h3>
            <span className="text-xs text-gray-400">Specify subject, timeslot, and priority rating</span>
          </div>
          <form onSubmit={handleManualAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">SELECT SUBJECT</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm bg-white"
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Day */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">CALENDAR DAY</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm bg-white"
                >
                  {WEEKDAYS.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Start */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">START TIME</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm"
                  required
                />
              </div>

              {/* End */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">END TIME</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm"
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">SESSION PRIORITY</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm bg-white"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p} Priority</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingBlock(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm bg-maroon-800 hover:bg-maroon-900 text-white font-medium rounded-lg shadow"
              >
                Insert Block
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Auto scheduler wizard */}
      {isAutoScheduling && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-peach-400 animate-fadeIn" id="auto-scheduler-panel">
          <div className="flex items-center gap-2 text-lg font-bold text-maroon-800 mb-3">
            <Cpu className="text-maroon-800" />
            <h3>Configure Greedy Auto-Scheduler</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4 max-w-2xl leading-relaxed">
            Our algorithm will inspect your remaining chapter counts, exam date proximity, and design a customized
            weekly calendar. Active subjects with lower syllabus coverage and closer exams are allocated high priority morning blocks.
          </p>
          <form onSubmit={handleAutoRun} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
              {/* Daily hrs limit */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">AVAILABLE STUDY HOURS PER DAY</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-maroon-800"
                  />
                  <span className="text-sm font-bold text-maroon-800 min-w-[50px] text-right font-mono">
                    {hoursPerDay} hrs/day
                  </span>
                </div>
              </div>

              {/* Exam Date Review */}
              <div>
                <h4 className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Audit Exam Target Dates</h4>
                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-2">
                  {subjects.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs gap-4 bg-white p-2 rounded shadow-xs">
                      <span className="font-semibold text-gray-700 truncate max-w-[150px]">{s.name}</span>
                      <input
                        type="date"
                        value={examDates[s.id] || ''}
                        onChange={(e) => handleExamDateChange(s.id, e.target.value)}
                        className="border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-maroon-800"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-50 pt-3">
              <button
                type="button"
                onClick={() => setIsAutoScheduling(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 text-sm bg-maroon-800 hover:bg-maroon-900 text-white font-semibold rounded-lg shadow-sm"
              >
                <Sparkles size={16} className="text-peach-400" />
                Initialize Auto-Allocation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar Columns Mon to Sun */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {WEEKDAYS.map((dayName) => {
          const currentDayBlocks = blocksByDay[dayName];

          return (
            <div
              key={dayName}
              className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden flex flex-col min-h-[300px]"
              id={`calendar-column-${dayName}`}
            >
              {/* Day Header */}
              <div className="bg-cream/40 p-3 text-center border-b border-gray-100">
                <span className="font-bold text-maroon-800 font-display text-sm block">{dayName}</span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {currentDayBlocks.length} {currentDayBlocks.length === 1 ? 'block' : 'blocks'} scheduled
                </span>
              </div>

              {/* Day Block list */}
              <div className="p-3.5 flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[420px] bg-peach-50/10">
                {currentDayBlocks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <Clock size={18} className="text-gray-300 stroke-[1.5] mb-1" />
                    <span className="text-[11px] text-gray-400">Clear Space</span>
                  </div>
                ) : (
                  currentDayBlocks.map((block) => {
                    const subColor = getSubjectColor(block.subjectId);
                    return (
                      <div
                        key={block.id}
                        className={`group relative border-l-3 rounded-lg p-2.5 text-xs flex flex-col justify-between hover:shadow-md transition-shadow duration-200 ${getPriorityStyle(block.priority)}`}
                        style={{ borderLeftColor: subColor }}
                        id={`study-block-${block.id}`}
                      >
                        {/* Time stamp */}
                        <div className="flex items-center justify-between text-[10px] opacity-90 font-mono mb-1 label-container">
                          <span className="flex items-center gap-1 font-bold">
                            <Clock size={10} />
                            {block.startTime} - {block.endTime}
                          </span>
                          <span className={`px-1 rounded-sm text-[9px] font-bold ${block.priority === 'High' ? 'bg-white/20' : block.priority === 'Medium' ? 'bg-white/15' : 'bg-maroon-800/10'}`}>
                            {block.priority[0]}
                          </span>
                        </div>

                        {/* Subject Name - Bold */}
                        <div className="font-bold truncate mt-0.5" title={getSubjectName(block.subjectId)}>
                          {getSubjectName(block.subjectId)}
                        </div>

                        {/* Delete action overlay */}
                        <button
                          onClick={() => {
                            onDeleteBlock(block.id);
                            onShowToast('Removed study session', 'info');
                          }}
                          className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-red-50 text-red-600 p-1.5 rounded-full border border-gray-100 shadow-sm transition-all focus:opacity-100 cursor-pointer duration-150"
                          title="Delete Session"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
