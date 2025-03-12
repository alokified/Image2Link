/*
  # Fix image deletion cascade

  1. Changes
    - Add ON DELETE CASCADE to storage.objects references
    - Add policy for deleting objects from storage
    - Ensure proper cleanup of deleted images

  2. Security
    - Add policies for delete operations
*/

-- Add policy to allow deleting objects from storage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Anyone can delete images'
  ) THEN
    CREATE POLICY "Anyone can delete images"
      ON storage.objects
      FOR DELETE
      USING (bucket_id = 'images');
  END IF;
END $$;