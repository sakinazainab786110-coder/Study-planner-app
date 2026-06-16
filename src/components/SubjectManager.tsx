import React, { useState } from 'react';
import { Subject } from '../types';
import { Plus, Trash2, Edit2, BookOpen, Calendar, HelpCircle } from 'lucide-react';

interface SubjectManagerProps {
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'warning') => void;
}

const PRESET_COLORS = [
  '#800020', // Maroon
  '#FFCBA4', // Peach
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#6b7280', // Slate Gray
];

export default function SubjectManager({
  subjects,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onShowToast,
}: SubjectManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState('#800020');
  const [totalChapters, setTotalChapters] = useState(10);
  const [completedChapters, setCompletedChapters] = useState(0);
  const [examDate, setExamDate] = useState('');

  const resetForm = () => {
    setName('');
    setColor('#800020');
    setTotalChapters(10);
    setCompletedChapters(0);
    setExamDate('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Subject name cannot be empty', 'warning');
      return;
    }
    if (completedChapters > totalChapters) {
      onShowToast('Completed chapters cannot exceed total chapters', 'warning');
      return;
    }

    onAddSubject({
      name: name.trim(),
      color,
      totalChapters: Number(totalChapters) || 1,
      completedChapters: Number(completedChapters) || 0,
      examDate: examDate || undefined,
    });
    
    onShowToast(`Subject "${name}" added successfully!`, 'success');
    resetForm();
  };

  const startEdit = (sub: Subject) => {
    setEditingId(sub.id);
    setName(sub.name);
    setColor(sub.color);
    setTotalChapters(sub.totalChapters);
    setCompletedChapters(sub.completedChapters);
    setExamDate(sub.examDate || '');
    setIsAdding(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!name.trim()) {
      onShowToast('Subject name cannot be empty', 'warning');
      return;
    }
    if (completedChapters > totalChapters) {
      onShowToast('Completed chapters cannot exceed total chapters', 'warning');
      return;
    }

    onEditSubject({
      id: editingId,
      name: name.trim(),
      color,
      totalChapters: Number(totalChapters) || 1,
      completedChapters: Number(completedChapters) || 0,
      examDate: examDate || undefined,
    });

    onShowToast(`Subject "${name}" updated successfully!`, 'success');
    resetForm();
  };

  const handleDelete = (id: string, subName: string) => {
    if (window.confirm(`Are you sure you want to delete "${subName}"? All scheduled blocks and notes for this subject will be affected.`)) {
      onDeleteSubject(id);
      onShowToast(`Subject "${subName}" deleted.`, 'info');
    }
  };

  return (
    <div className="space-y-6" id="subject-manager-section">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-maroon-800 tracking-tight">Subject Manager</h2>
          <p className="text-sm text-gray-500">Track and manage your curriculums, syllabi progress, and exam timetables</p>
        </div>
        {!isAdding && !editingId && (
          <button
            id="add-subject-btn"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-maroon-800 hover:bg-maroon-900 text-white px-4 py-2.5 rounded-lg font-medium transition cursor-pointer shadow-md text-sm"
          >
            <Plus size={18} className="text-peach-400" />
            Add Subject
          </button>
        )}
      </div>

      {/* Form Area - Edit or Add */}
      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-maroon-800 animate-fadeIn" id="subject-form-card">
          <h3 className="text-lg font-bold text-maroon-800 mb-4">
            {editingId ? 'Edit Subject Details' : 'Introduce New Curriculum Subject'}
          </h3>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">SUBJECT NAME</label>
                <input
                  id="subject-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Inorganic Chemistry, Macroeconomics"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm"
                  required
                />
              </div>

              {/* Exam Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">EXAM DATE (OPTIONAL)</label>
                <input
                  id="subject-exam-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm"
                />
              </div>

              {/* Chapters Syllabus */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">TOTAL SYLLABUS CHAPTERS</label>
                <input
                  id="subject-total-chapters"
                  type="number"
                  min="1"
                  value={totalChapters}
                  onChange={(e) => setTotalChapters(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm"
                  required
                />
              </div>

              {/* Completed Chapters */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">COMPLETED CHAPTERS</label>
                <input
                  id="subject-completed-chapters"
                  type="number"
                  min="0"
                  max={totalChapters}
                  value={completedChapters}
                  onChange={(e) => setCompletedChapters(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm"
                  required
                />
              </div>
            </div>

            {/* Color Tag Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">COLOR TAG ACCENT</label>
              <div className="flex flex-wrap gap-2.5 items-center">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full border-2 transition cursor-pointer transform hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? '#1f2937' : 'transparent',
                    }}
                    title={c}
                  />
                ))}
                {/* Custom hex input */}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-md cursor-pointer stroke-none border border-gray-200"
                  title="Custom Color Pick"
                />
                <span className="text-xs text-gray-500 font-mono ml-1">{color.toUpperCase()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium bg-maroon-800 hover:bg-maroon-900 text-white rounded-lg transition cursor-pointer shadow-sm"
              >
                {editingId ? 'Save Changes' : 'Create Subject'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-4" id="subjects-empty-state">
          {/* Detailed Empty State Illustration SVG */}
          <svg className="w-48 h-48 text-maroon-200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="#FFF5EE" />
            <path d="M50 70C50 64.4772 54.4772 60 60 60H140C145.523 60 150 64.4772 150 70V140C150 145.523 145.523 150 140 150H60C54.4772 150 50 145.523 50 140V70Z" fill="white" stroke="#800020" strokeWidth="3" />
            <path d="M70 85H130" stroke="#FFCBA4" strokeWidth="4" strokeLinecap="round" />
            <path d="M70 105H115" stroke="#800020" strokeWidth="4" strokeLinecap="round" />
            <path d="M70 125H100" stroke="#800020" strokeWidth="3" strokeLinecap="round" />
            <circle cx="140" cy="125" r="15" fill="#FFCBA4" stroke="#800020" strokeWidth="2" />
            <path d="M135 125L138 128L145 121" stroke="#800020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-maroon-900">No active subjects found</h3>
            <p className="text-sm text-gray-500 max-w-md">Begin your academic planning journey by typing in your first study subject above (e.g. Mathematics, History, Physics).</p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-2 bg-maroon-800 hover:bg-maroon-900 text-white px-4 py-2 rounded-lg font-medium transition text-sm cursor-pointer"
          >
            Add First Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => {
            const progressRatio = sub.totalChapters > 0 ? sub.completedChapters / sub.totalChapters : 0;
            const progressPercent = Math.round(progressRatio * 100);
            
            // SVG Circle calculations
            const radius = 32;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (progressRatio * circumference);

            return (
              <div
                key={sub.id}
                className="bg-white rounded-xl shadow-xs border-l-4 p-5 hover:shadow-md transition relative duration-200 flex flex-col justify-between"
                style={{ borderLeftColor: sub.color }}
                id={`subject-card-${sub.id}`}
              >
                {/* Upper Subject Detail */}
                <div>
                  <div className="flex justify-between items-start">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${sub.color}22`, color: sub.color }}
                    >
                      Chapters: {sub.completedChapters}/{sub.totalChapters}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => startEdit(sub)}
                        className="p-1.5 text-gray-400 hover:text-maroon-800 rounded-md hover:bg-gray-50 transition cursor-pointer"
                        title="Edit Subject"
                        id={`edit-sub-${sub.id}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id, sub.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-50 transition cursor-pointer"
                        title="Delete Subject"
                        id={`delete-sub-${sub.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mt-2.5 line-clamp-1">{sub.name}</h3>

                  <div className="mt-3.5 space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-gray-400" />
                      <span>{sub.totalChapters - sub.completedChapters} chapters remaining</span>
                    </div>
                    {sub.examDate ? (
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar size={14} className="text-maroon-700" />
                        <span className="text-maroon-800">Exam: {sub.examDate}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={14} />
                        <span>No exam date set</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lower Circular Progress Indicator Footer */}
                <div className="flex items-center gap-4 border-t border-gray-50 pt-4 mt-5">
                  {/* Progress Ring */}
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Background Circle */}
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke="#f3f4f6"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      {/* Progress Circle */}
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke={sub.color}
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-gray-800 font-mono">
                      {progressPercent}%
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Curriculum Status</h4>
                    <p className="text-xs text-gray-500">
                      {progressPercent === 100 
                        ? 'Mastered all concepts!' 
                        : progressPercent >= 50 
                          ? 'Well past midway mark' 
                          : progressPercent > 0 
                            ? 'Making steady progress' 
                            : 'Not yet started'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
