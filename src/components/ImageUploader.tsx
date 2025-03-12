import React, { useState, useEffect } from 'react';
import { Upload, Copy, ExternalLink, AlertCircle, Trash2, Download } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

export function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [images, setImages] = useState<Array<{ id: string; url: string; filename: string }>>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const uploadImage = async (file: File) => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error(`${file.name} is not an image file`);
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`${file.name} exceeds 5MB size limit`);
      }

      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            setUploadProgress(prev => ({
              ...prev,
              [fileName]: Math.round(percentage)
            }));
          }
        });

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

      return publicUrl;
    } catch (error) {
      throw error;
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSupabaseConfigured()) {
      toast.error('Please connect to Supabase first');
      return;
    }

    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      const uploadPromises = files.map(file => uploadImage(file));
      
      // Show initial upload toast
      const uploadToast = toast.loading(
        `Uploading ${files.length} ${files.length === 1 ? 'image' : 'images'}...`
      );

      // Upload all images concurrently
      const results = await Promise.allSettled(uploadPromises);

      // Count successful and failed uploads
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      // Update toast with final status
      if (failed === 0) {
        toast.success(`Successfully uploaded ${successful} ${successful === 1 ? 'image' : 'images'}`, {
          id: uploadToast
        });
      } else {
        toast.error(
          `${successful} uploaded, ${failed} failed`,
          { id: uploadToast }
        );
      }

      // Refresh the images list
      fetchImages();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      // Clear the file input
      event.target.value = '';
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

  const handleDelete = async (image: { id: string; url: string; filename: string }) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setDeleting(image.id);
    try {
      // Extract the filename from the URL
      const urlParts = image.url.split('/');
      const filename = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([filename]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      // Update local state
      setImages(images.filter(img => img.id !== image.id));
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (image: { url: string; filename: string }) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
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
            <p className="mt-2 text-gray-600">Upload multiple images at once and get shareable links</p>
          </div>

          <div className="relative">
            <input
              type="file"
              onChange={handleUpload}
              accept="image/*"
              multiple
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
                  {uploading ? 'Uploading...' : 'Click to upload images'}
                </span>
                <span className="text-xs text-gray-500">
                  Supports multiple images (max 5MB each)
                </span>
              </div>
            </label>
          </div>

          {/* Upload Progress */}
          {Object.entries(uploadProgress).length > 0 && (
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename} className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">{filename}</span>
                    <span className="text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
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
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative group">
                <img
                  src={image.url}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(image.url)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  title="Copy Link"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy Link</span>
                </button>
                <button
                  onClick={() => handleDownload(image)}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  title="Open"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open</span>
                </a>
                <button
                  onClick={() => handleDelete(image)}
                  disabled={deleting === image.id}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}