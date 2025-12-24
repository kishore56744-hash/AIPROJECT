import { useState } from 'react';
import { supabase, Visit, Photo, Note, Report } from '../lib/supabase';
import { FileText, Download, Loader2, Sparkles } from 'lucide-react';

type ReportViewProps = {
  visit: Visit;
  photos: Photo[];
  notes: Note[];
  report: Report | null;
  onReportGenerated: (report: Report) => void;
};

export function ReportView({ visit, photos, notes, report, onReportGenerated }: ReportViewProps) {
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const reportContent = createReport(visit, photos, notes);

      const { data, error } = await supabase
        .from('reports')
        .insert({
          visit_id: visit.id,
          report_content: reportContent,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onReportGenerated(data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const createReport = (visit: Visit, photos: Photo[], notes: Note[]): string => {
    const notesByCategory: Record<string, Note[]> = {};
    notes.forEach(note => {
      if (!notesByCategory[note.category]) {
        notesByCategory[note.category] = [];
      }
      notesByCategory[note.category].push(note);
    });

    const categoryTitles: Record<string, string> = {
      academics: 'Academic Programs & Quality',
      campus: 'Campus Life & Culture',
      facilities: 'Facilities & Resources',
      location: 'Location & Surroundings',
      housing: 'Housing & Accommodation',
      financial: 'Financial Aid & Costs',
      social: 'Social Environment',
      general: 'General Observations',
    };

    let report = `# College Visit Report: ${visit.college_name}\n\n`;
    report += `**Visit Date:** ${new Date(visit.visit_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}\n\n`;

    if (visit.location) {
      report += `**Location:** ${visit.location}\n\n`;
    }

    report += `---\n\n`;

    report += `## Executive Summary\n\n`;
    report += `This report documents my visit to ${visit.college_name}. `;
    report += `During this visit, I took ${photos.length} photo${photos.length !== 1 ? 's' : ''} `;
    report += `and recorded ${notes.length} detailed note${notes.length !== 1 ? 's' : ''} `;
    report += `across ${Object.keys(notesByCategory).length} different categories.\n\n`;

    if (Object.keys(notesByCategory).length > 0) {
      report += `## Detailed Observations\n\n`;

      Object.entries(notesByCategory).forEach(([category, categoryNotes]) => {
        report += `### ${categoryTitles[category] || category}\n\n`;

        categoryNotes.forEach((note, index) => {
          report += `${note.content}\n\n`;
        });
      });
    }

    if (photos.length > 0) {
      report += `## Visual Documentation\n\n`;
      report += `I captured ${photos.length} photo${photos.length !== 1 ? 's' : ''} during my visit, documenting various aspects of the campus including:\n\n`;

      photos.forEach((photo, index) => {
        if (photo.caption) {
          report += `- ${photo.caption}\n`;
        }
      });
      report += `\n`;
    }

    report += `## Key Takeaways\n\n`;

    if (notes.length === 0) {
      report += `While I didn't record specific notes during this visit, the experience and photos provide valuable documentation for future reference.\n\n`;
    } else {
      report += `Based on my observations and notes, here are the main points to consider:\n\n`;

      const keyPoints = [];
      if (notesByCategory['academics']) {
        keyPoints.push('Academic programs and educational opportunities were evaluated');
      }
      if (notesByCategory['campus']) {
        keyPoints.push('Campus culture and student life were observed');
      }
      if (notesByCategory['facilities']) {
        keyPoints.push('Campus facilities and resources were examined');
      }
      if (notesByCategory['location']) {
        keyPoints.push('Location and surrounding area were assessed');
      }
      if (notesByCategory['housing']) {
        keyPoints.push('Housing options and living arrangements were reviewed');
      }
      if (notesByCategory['financial']) {
        keyPoints.push('Financial considerations and aid opportunities were discussed');
      }
      if (notesByCategory['social']) {
        keyPoints.push('Social environment and community aspects were evaluated');
      }

      keyPoints.forEach(point => {
        report += `- ${point}\n`;
      });
      report += `\n`;
    }

    report += `## Next Steps\n\n`;
    report += `- Review this report alongside other college visit reports\n`;
    report += `- Compare academic programs, campus culture, and overall fit\n`;
    report += `- Consider revisiting if needed for deeper exploration\n`;
    report += `- Discuss findings with family, counselors, and mentors\n`;
    report += `- Make informed decisions about college applications\n\n`;

    report += `---\n\n`;
    report += `*Report generated on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}*\n`;

    return report;
  };

  const downloadReport = () => {
    if (!report) return;

    const blob = new Blob([report.report_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${visit.college_name.replace(/\s+/g, '_')}_Visit_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!report) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Report Generated Yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Generate a comprehensive visit report based on your photos and notes. The report will summarize your observations and help you compare this college with others.
        </p>
        <button
          onClick={generateReport}
          disabled={generating}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Report
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Visit Report</h3>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          Download
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 prose max-w-none">
        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {report.report_content.split('\n').map((line, index) => {
            if (line.startsWith('# ')) {
              return <h1 key={index} className="text-3xl font-bold text-gray-900 mb-4">{line.substring(2)}</h1>;
            } else if (line.startsWith('## ')) {
              return <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{line.substring(3)}</h2>;
            } else if (line.startsWith('### ')) {
              return <h3 key={index} className="text-xl font-semibold text-gray-800 mt-6 mb-3">{line.substring(4)}</h3>;
            } else if (line.startsWith('**') && line.endsWith('**')) {
              const content = line.substring(2, line.length - 2);
              return <p key={index} className="font-semibold text-gray-900 mb-2">{content}</p>;
            } else if (line.includes('**')) {
              const parts = line.split('**');
              return (
                <p key={index} className="mb-2">
                  {parts.map((part, i) =>
                    i % 2 === 0 ? <span key={i}>{part}</span> : <strong key={i}>{part}</strong>
                  )}
                </p>
              );
            } else if (line.startsWith('- ')) {
              return <li key={index} className="ml-6 mb-1">{line.substring(2)}</li>;
            } else if (line === '---') {
              return <hr key={index} className="my-6 border-gray-300" />;
            } else if (line.trim() === '') {
              return <br key={index} />;
            } else {
              return <p key={index} className="mb-3">{line}</p>;
            }
          })}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Report generated on {new Date(report.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
}
