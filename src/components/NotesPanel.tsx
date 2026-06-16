import React, { useState, useEffect, useRef } from 'react';
import { Subject, Note } from '../types';
import { FileText, Save, Check, Loader2, Sparkles } from 'lucide-react';

interface NotesPanelProps {
  subjects: Subject[];
  notes: Note[];
  onSaveNote: (subjectId: string, content: string) => void;
  onShowToast: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export default function NotesPanel({
  subjects,
  notes,
  onSaveNote,
  onShowToast,
}: NotesPanelProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [noteText, setNoteText] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set initial selected subject
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects]);

  // Load note text when active subject changes
  useEffect(() => {
    if (selectedSubjectId) {
      const activeNote = notes.find((n) => n.subjectId === selectedSubjectId);
      setNoteText(activeNote ? activeNote.content : '');
      setSaveStatus('idle');
    }
  }, [selectedSubjectId, notes]);

  // Auto-save debounced logic
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    setSaveStatus('saving');

    // Clear old timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced autosave (500ms)
    debounceTimerRef.current = setTimeout(() => {
      if (selectedSubjectId) {
        onSaveNote(selectedSubjectId, text);
        setSaveStatus('saved');
        // Back to idle status briefly
        setTimeout(() => setSaveStatus('idle'), 1500);
      }
    }, 500);
  };

  // Immediate save on click
  const triggerManualSave = () => {
    if (!selectedSubjectId) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSaveNote(selectedSubjectId, noteText);
    setSaveStatus('saved');
    onShowToast('Note manual save compiled.', 'success');
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const getSubjectColor = (subId: string) => {
    const s = subjects.find((sub) => sub.id === subId);
    return s ? s.color : '#800020';
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 grid grid-cols-1 md:grid-cols-4 overflow-hidden min-h-[450px]" id="notes-panel-section">
      {/* Side subjects selector */}
      <div className="border-r border-gray-100 p-4 bg-gray-50/50 flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Review Registers</h3>
          {subjects.length === 0 ? (
            <p className="text-xs text-gray-400">Add syllabus subjects first to unlock quick notes.</p>
          ) : (
            <div className="space-y-1.5" id="notes-subject-tabs">
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`w-full text-left px-3.2 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    selectedSubjectId === sub.id
                      ? 'bg-maroon-800 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate">{sub.name}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: sub.color }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Characters display */}
        {selectedSubjectId && (
          <div className="text-[10px] text-gray-400/80 font-mono pt-4 border-t border-gray-100 leading-relaxed font-bold">
            ⚡ Quick notes are saved immediately to local storage on key up.
          </div>
        )}
      </div>

      {/* Editor Content Area */}
      <div className="col-span-1 md:col-span-3 p-5 flex flex-col justify-between space-y-4" id="notes-editor-frame">
        {selectedSubjectId && selectedSubject ? (
          <>
            {/* Header elements */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-maroon-800" size={18} />
                <h3 className="font-bold text-gray-900 text-base">{selectedSubject.name} Log</h3>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Save status label */}
                <div className="text-xs text-gray-400">
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1 text-gray-500 font-medium">
                      <Loader2 className="animate-spin text-maroon-700" size={12} />
                      Syncing...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Check size={12} className="stroke-[3]" />
                      Autosaved
                    </span>
                  )}
                  {saveStatus === 'idle' && (
                    <span className="text-gray-400">Draft version</span>
                  )}
                </div>

                <button
                  onClick={triggerManualSave}
                  className="p-1.5 text-gray-400 hover:text-[#800020] hover:bg-gray-50 rounded-lg transition"
                  title="Force compile notes save"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>

            {/* Note Area Field */}
            <textarea
              value={noteText}
              onChange={handleTextChange}
              placeholder={`Write outline reviews, theorems, formula maps or syllabus notes for ${selectedSubject.name} here...`}
              className="flex-1 w-full p-4 bg-cream/20 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-800 text-sm leading-relaxed min-h-[300px] resize-none"
              style={{ caretColor: selectedSubject.color }}
              id={`notes-textarea-${selectedSubject.id}`}
            />

            {/* Character stats bar */}
            <div className="flex justify-between items-center text-xs text-gray-400 font-medium pt-1">
              <span>{noteText.split(/\s+/).filter(Boolean).length} words</span>
              <span>{noteText.length} characters logged</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <svg className="w-36 h-36 text-maroon-200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" fill="#FFF5EE" />
              <rect x="35" y="30" width="30" height="40" rx="4" fill="white" stroke="#800020" strokeWidth="2.5" />
              <line x1="42" y1="40" x2="58" y2="40" stroke="#FFCBA4" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="42" y1="45" x2="54" y2="45" stroke="#E5E7EB" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="42" y1="50" x2="50" y2="50" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h4 className="text-gray-900 font-bold mt-2">Notebook locked</h4>
            <p className="text-xs text-gray-500 max-w-xs mt-1">Select/create a subject on the left toolbar to compile study memos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
