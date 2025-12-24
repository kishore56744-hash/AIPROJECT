import { useState } from 'react';
import { supabase, Note } from '../lib/supabase';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';

type NotesListProps = {
  visitId: string;
  notes: Note[];
  onNoteAdded: (note: Note) => void;
  onNoteDeleted: (noteId: string) => void;
};

const CATEGORIES = [
  { value: 'academics', label: 'Academics' },
  { value: 'campus', label: 'Campus Life' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'location', label: 'Location' },
  { value: 'housing', label: 'Housing' },
  { value: 'financial', label: 'Financial Aid' },
  { value: 'social', label: 'Social Scene' },
  { value: 'general', label: 'General' },
];

export function NotesList({ visitId, notes, onNoteAdded, onNoteDeleted }: NotesListProps) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [category, setCategory] = useState('general');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const handleSaveNote = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      if (editingNote) {
        const { data, error } = await supabase
          .from('notes')
          .update({ content, category, updated_at: new Date().toISOString() })
          .eq('id', editingNote.id)
          .select()
          .single();

        if (error) throw error;
        setEditingNote(null);
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert({
            visit_id: visitId,
            category,
            content,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          onNoteAdded(data);
        }
      }

      setContent('');
      setCategory('general');
      setShowAddNote(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setContent(note.content);
    setCategory(note.category);
    setShowAddNote(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) throw error;
      onNoteDeleted(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const cancelEdit = () => {
    setShowAddNote(false);
    setEditingNote(null);
    setContent('');
    setCategory('general');
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      academics: 'bg-blue-100 text-blue-700',
      campus: 'bg-green-100 text-green-700',
      facilities: 'bg-purple-100 text-purple-700',
      location: 'bg-orange-100 text-orange-700',
      housing: 'bg-yellow-100 text-yellow-700',
      financial: 'bg-red-100 text-red-700',
      social: 'bg-pink-100 text-pink-700',
      general: 'bg-gray-100 text-gray-700',
    };
    return colors[cat] || colors.general;
  };

  return (
    <div>
      {!showAddNote && (
        <div className="mb-6">
          <button
            onClick={() => setShowAddNote(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Note
          </button>
        </div>
      )}

      {showAddNote && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your observations, thoughts, or questions..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              disabled={saving || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No notes yet. Add some to capture your thoughts and observations!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(note.category)}`}>
                  {CATEGORIES.find(c => c.value === note.category)?.label || note.category}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(note.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
