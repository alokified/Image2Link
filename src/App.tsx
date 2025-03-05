import React from 'react';
import { Toaster } from 'react-hot-toast';
import { ImageUploader } from './components/ImageUploader';
import { ImageIcon } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-8">
          <div className="flex items-center space-x-3">
            <ImageIcon className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">Image Share</h1>
          </div>
          
          <ImageUploader />
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;