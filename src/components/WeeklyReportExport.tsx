import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Subject, Task, PomodoroLog, SrsItem } from '../types';
import { FileDown, Check, Loader2 } from 'lucide-react';

interface WeeklyReportExportProps {
  subjects: Subject[];
  tasks: Task[];
  pomodoroLogs: PomodoroLog[];
  srsItems: SrsItem[];
  weeklyHourGoal: number;
}

export default function WeeklyReportExport({
  subjects,
  tasks,
  pomodoroLogs,
  srsItems,
  weeklyHourGoal
}: WeeklyReportExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const getSubjectHourMetric = (subId: string) => {
    const logs = pomodoroLogs.filter(log => log.subjectId === subId);
    const sumMins = logs.reduce((sum, log) => sum + log.duration, 0);
    return parseFloat((sumMins / 60).toFixed(2));
  };

  const handleGeneratePdf = () => {
    setIsGenerating(true);

    try {
      // Create a standard letter-size PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      // 1. Margins & Coordinates Helper
      const margin = 20;
      let y = 25;

      // Draw elegant Peach/Maroon accent borders
      doc.setDrawColor(128, 0, 32); // Maroon
      doc.setLineWidth(1.5);
      doc.rect(10, 10, 195, 259); // Page outer border frame

      doc.setDrawColor(255, 203, 164); // Peach
      doc.setLineWidth(0.5);
      doc.rect(12, 12, 191, 255);

      // 2. Report Header Block
      doc.setFillColor(128, 0, 32); // Maroon background banner
      doc.rect(15, 15, 185, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('WEEKLY ACADEMIC PLANNER REPORT', 20, 25);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(255, 203, 164); // Peach text
      doc.text(`Prepared for: Sakina  •  Date Created: 2026-06-16 (Today)`, 20, 31);

      y = 52;

      // 3. Overall Performance Dashboard Section Summary
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(128, 0, 32);
      doc.text('1. OVERALL METRICS & TARGET PROGRESS', 18, y);
      
      doc.setDrawColor(128, 0, 32);
      doc.setLineWidth(0.3);
      doc.line(18, y + 2, 195, y + 2);
      y += 8;

      const totalHours = parseFloat((pomodoroLogs.reduce((sum, l) => sum + l.duration, 0) / 60).toFixed(1));
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.completed).length;
      const completedChapters = subjects.reduce((sum, s) => sum + s.completedChapters, 0);
      const totalChapters = subjects.reduce((sum, s) => sum + s.totalChapters, 0);

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      
      const metricsText = [
        `• Accumulated Focus Duration: ${totalHours} hours`,
        `• Weekly Goal Threshold: ${weeklyHourGoal} hours`,
        `• Chapter Syllabus Coverage: ${completedChapters} completed of ${totalChapters} total chapters`,
        `• Priority Task Success Rate: ${completedTasks} checked off of ${totalTasks} total tasks`
      ];

      metricsText.forEach(txt => {
        doc.text(txt, 22, y);
        y += 6;
      });

      y += 6;

      // 4. Breakdown Table per Registered Subject
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(128, 0, 32);
      doc.text('2. INDIVIDUAL SUBJECT STATUS BREW', 18, y);
      doc.line(18, y + 2, 195, y + 2);
      y += 8;

      // Draw Table Header
      doc.setFillColor(128, 0, 32);
      doc.rect(18, y, 177, 7, 'F');
      
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Subject Name', 22, y + 5);
      doc.text('Chapters Cover', 75, y + 5);
      doc.text('Hours Studied', 120, y + 5);
      doc.text('Status Rating', 160, y + 5);
      
      y += 7;

      // Table Rows
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      subjects.forEach((sub, idx) => {
        // Alternating background pattern
        if (idx % 2 === 1) {
          doc.setFillColor(255, 245, 238); // Cream soft overlay
          doc.rect(18, y, 177, 7.5, 'F');
        }

        const hrs = getSubjectHourMetric(sub.id);
        const ratio = sub.totalChapters > 0 ? sub.completedChapters / sub.totalChapters : 0;
        const progressTag = ratio >= 0.8 ? 'Excellent' : ratio >= 0.4 ? 'Moderate' : 'Priority';

        doc.setFontSize(9.5);
        doc.text(sub.name, 22, y + 5.5);
        doc.text(`${sub.completedChapters} / ${sub.totalChapters}`, 75, y + 5.5);
        doc.text(`${hrs.toFixed(1)} hrs`, 120, y + 5.5);
        doc.text(progressTag, 160, y + 5.5);

        y += 7.5;
      });

      y += 8;

      // 5. Spaced Repetition Summary
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(128, 0, 32);
      doc.text('3. SPACED REPETITION CARD MATRIX (SRS)', 18, y);
      doc.line(18, y + 2, 195, y + 2);
      y += 8;

      const overAndDueDays = srsItems.filter(i => i.nextReviewDate <= '2026-06-16').length;
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`• Total Spaced Repetition Cards Loaded in Deck: ${srsItems.length}`, 22, y);
      y += 6;
      doc.text(`• Cards Currently Due for Immediate Recall Review today: ${overAndDueDays}`, 22, y);
      y += 8;

      // 6. Actionable advice section
      doc.setFillColor(255, 203, 164); // Peach banner alert
      doc.rect(18, y, 177, 24, 'F');

      doc.setTextColor(128, 0, 32);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('4. SYSTEM REASSESSMENTS & FOCUS STRATEGIES', 22, y + 6);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(80, 20, 30);
      const adviceStr = totalHours < weeklyHourGoal 
        ? "Action Plan: Focus hours are below weekly quotas. Try doing standard 50-minute blocks."
        : "Action Plan: Ideal speed profile detected! Do spaced reviews to lock down terms.";
      doc.text(adviceStr, 22, y + 12);
      doc.text("Maintain streaks of study on tasks above difficulty index of 3 stars.", 22, y + 17);

      y += 32;

      // 7. Footer tag
      doc.setDrawColor(255, 203, 164);
      doc.line(18, 252, 195, 252);

      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8.5);
      doc.setFont('Helvetica', 'italic');
      doc.text('This weekly report is programmatically assembled directly from your persistent study archives.', 18, 258);
      doc.text('Powered by AI Study Planner. Peak Maroon-Peach System design.', 135, 258);

      // Save PDF output locally
      doc.save(`StudyPlan_WeeklyReport_Sakina.pdf`);
      onShowToast('PDF Weekly Report exported successfully!', 'success');
    } catch (e: any) {
      console.error(e);
      onShowToast(`Failed to generate PDF document: ${e.message}`, 'warning');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGeneratePdf}
      disabled={isGenerating}
      className="bg-maroon-800 hover:bg-maroon-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
      id="pdf-download-trigger"
    >
      {isGenerating ? (
        <>
          <Loader2 className="animate-spin" size={15} />
          Compiling PDF...
        </>
      ) : (
        <>
          <FileDown size={15} />
          Weekly PDF Export
        </>
      )}
    </button>
  );
}
