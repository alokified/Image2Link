import React, { useState, useEffect } from 'react';
import { Upload, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

export function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{ id: string; url: string; filename: string }>>([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images');
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSupabaseConfigured()) {
      toast.error('Please connect to Supabase first');
      return;
    }

    try {
      setUploading(true);
      
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(data.path);

      // Save image metadata to database
      const { error: dbError } = await supabase
        .from('images')
        .insert([
          {
            url: publicUrl,
            filename: file.name
          }
        ]);

      if (dbError) throw dbError;

      setImageUrl(publicUrl);
      toast.success('Image uploaded successfully!');
      fetchImages(); // Refresh the images list
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
        <div className="flex flex-col items-center space-y-4 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-semibold text-gray-800">Supabase Connection Required</h2>
          <p className="text-gray-600">
            Please click the "Connect to Supabase" button in the top right corner to set up your project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Image Uploader</h2>
            <p className="mt-2 text-gray-600">Upload your images and get shareable links</p>
          </div>

          <div className="relative">
            <input
              type="file"
              onChange={handleUpload}
              accept="image/*"
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer
                ${uploading ? 'bg-gray-100 border-gray-300' : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'}`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-blue-500" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload an image'}
                </span>
              </div>
            </label>
          </div>

          {imageUrl && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={imageUrl}
                  alt="Uploaded preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Uploaded Images</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="space-y-2">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={image.url}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(image.url)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}