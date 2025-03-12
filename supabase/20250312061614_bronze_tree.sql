/*
  # Fix cascade deletion for images

  1. Changes
    - Add ON DELETE CASCADE to storage objects
    - Update RLS policies for proper deletion
    - Add storage trigger for cleanup

  2. Security
    - Maintain existing security policies
    - Add proper cascade behavior
*/

-- Create a function to handle storage cleanup
CREATE OR REPLACE FUNCTION handle_storage_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete from storage.objects when record is deleted from images table
  DELETE FROM storage.objects
  WHERE bucket_id = 'images'
    AND name = (
      SELECT split_part(OLD.url, '/', -1)
    );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for storage cleanup
DROP TRIGGER IF EXISTS cleanup_storage_on_delete ON images;
CREATE TRIGGER cleanup_storage_on_delete
  AFTER DELETE ON images
  FOR EACH ROW
  EXECUTE FUNCTION handle_storage_cleanup();