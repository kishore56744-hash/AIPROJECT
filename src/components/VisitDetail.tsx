import { useState, useEffect } from 'react';
import { supabase, Visit, Photo, Note, Report } from '../lib/supabase';
import { ArrowLeft, Camera, StickyNote, FileText, Trash2, Plus, Loader2 } from 'lucide-react';
import { PhotoGallery } from './PhotoGallery';
import { NotesList } from './NotesList';
import { ReportView } from './ReportView';

type VisitDetailProps = {
  visit: Visit;
  onBack: () => void;
  onDeleted: (visitId: string) => void;
};

type Tab = 'photos' | 'notes' | 'report';

export function VisitDetail({ visit, onBack, onDeleted }: VisitDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('photos');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadVisitData();
  }, [visit.id]);

  const loadVisitData = async () => {
    try {
      const [photosRes, notesRes, reportsRes] = await Promise.all([
        supabase.from('photos').select('*').eq('visit_id', visit.id).order('created_at', { ascending: false }),
        supabase.from('notes').select('*').eq('visit_id', visit.id).order('created_at', { ascending: false }),
        supabase.from('reports').select('*').eq('visit_id', visit.id).order('created_at', { ascending: false }).limit(1),
      ]);

      if (photosRes.data) setPhotos(photosRes.data);
      if (notesRes.data) setNotes(notesRes.data);
      if (reportsRes.data && reportsRes.data.length > 0) setReport(reportsRes.data[0]);
    } catch (error) {
      console.error('Error loading visit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisit = async () => {
    if (!confirm('Are you sure you want to delete this visit? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.from('visits').delete().eq('id', visit.id);
      if (error) throw error;
      onDeleted(visit.id);
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('Failed to delete visit');
      setDeleting(false);
    }
  };

  const handlePhotoAdded = (photo: Photo) => {
    setPhotos([photo, ...photos]);
  };

  const handlePhotoDeleted = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId));
  };

  const handleNoteAdded = (note: Note) => {
    setNotes([note, ...notes]);
  };

  const handleNoteDeleted = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
  };

  const handleReportGenerated = (newReport: Report) => {
    setReport(newReport);
    setActiveTab('report');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{visit.college_name}</h1>
                <p className="text-sm text-gray-600">
                  {new Date(visit.visit_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={handleDeleteVisit}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('photos')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'photos'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Camera className="w-5 h-5" />
                Photos ({photos.length})
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <StickyNote className="w-5 h-5" />
                Notes ({notes.length})
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'report'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-5 h-5" />
                Report
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === 'photos' && (
                  <PhotoGallery
                    visitId={visit.id}
                    photos={photos}
                    onPhotoAdded={handlePhotoAdded}
                    onPhotoDeleted={handlePhotoDeleted}
                  />
                )}
                {activeTab === 'notes' && (
                  <NotesList
                    visitId={visit.id}
                    notes={notes}
                    onNoteAdded={handleNoteAdded}
                    onNoteDeleted={handleNoteDeleted}
                  />
                )}
                {activeTab === 'report' && (
                  <ReportView
                    visit={visit}
                    photos={photos}
                    notes={notes}
                    report={report}
                    onReportGenerated={handleReportGenerated}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
