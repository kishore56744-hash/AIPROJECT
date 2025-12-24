import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Visit } from '../lib/supabase';
import { Plus, LogOut, MapPin, Calendar, FileText } from 'lucide-react';
import { VisitDetail } from './VisitDetail';
import { NewVisitModal } from './NewVisitModal';

export function Dashboard() {
  const { signOut } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitCreated = (visit: Visit) => {
    setVisits([visit, ...visits]);
    setSelectedVisit(visit);
    setShowNewVisitModal(false);
  };

  const handleVisitDeleted = (visitId: string) => {
    setVisits(visits.filter(v => v.id !== visitId));
    setSelectedVisit(null);
  };

  if (selectedVisit) {
    return (
      <VisitDetail
        visit={selectedVisit}
        onBack={() => setSelectedVisit(null)}
        onDeleted={handleVisitDeleted}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My College Visits</h1>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => setShowNewVisitModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-5 h-5" />
            New College Visit
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading visits...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No visits yet</h3>
            <p className="text-gray-600 mb-6">Start documenting your college visits to generate detailed reports</p>
            <button
              onClick={() => setShowNewVisitModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Your First Visit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visits.map((visit) => (
              <button
                key={visit.id}
                onClick={() => setSelectedVisit(visit)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 text-left border border-gray-200 hover:border-blue-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {visit.college_name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    visit.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {visit.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(visit.visit_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  {visit.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {visit.location}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {showNewVisitModal && (
        <NewVisitModal
          onClose={() => setShowNewVisitModal(false)}
          onVisitCreated={handleVisitCreated}
        />
      )}
    </div>
  );
}
