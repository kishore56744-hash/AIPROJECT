import { useState, useRef } from 'react';
import { supabase, Photo } from '../lib/supabase';
import { Plus, X, Trash2 } from 'lucide-react';

type PhotoGalleryProps = {
  visitId: string;
  photos: Photo[];
  onPhotoAdded: (photo: Photo) => void;
  onPhotoDeleted: (photoId: string) => void;
};

export function PhotoGallery({ visitId, photos, onPhotoAdded, onPhotoDeleted }: PhotoGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowCaptionModal(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${visitId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('visit-photos')
        .upload(fileName, selectedFile);

      if (uploadError) {
        if (uploadError.message.includes('not found')) {
          const { error: bucketError } = await supabase.storage.createBucket('visit-photos', {
            public: true,
          });

          if (!bucketError) {
            await supabase.storage.from('visit-photos').upload(fileName, selectedFile);
          }
        } else {
          throw uploadError;
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('visit-photos')
        .getPublicUrl(fileName);

      const { data, error: insertError } = await supabase
        .from('photos')
        .insert({
          visit_id: visitId,
          photo_url: publicUrl,
          caption: caption,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        onPhotoAdded(data);
        setShowCaptionModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption('');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;

    try {
      const { error } = await supabase.from('photos').delete().eq('id', photoId);
      if (error) throw error;
      onPhotoDeleted(photoId);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  const cancelUpload = () => {
    setShowCaptionModal(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="photo-upload"
        />
        <label
          htmlFor="photo-upload"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Photo
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No photos yet. Add some to document your visit!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.photo_url}
                alt={photo.caption}
                className="w-full h-64 object-cover rounded-lg"
              />
              {photo.caption && (
                <p className="mt-2 text-sm text-gray-700">{photo.caption}</p>
              )}
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showCaptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Photo</h3>
              <button
                onClick={cancelUpload}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}

            <div className="mb-4">
              <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                Caption (optional)
              </label>
              <input
                id="caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a caption for this photo"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelUpload}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
