/*
  # Update storage policies for image uploads

  1. Security Policies
    - Enables public access for viewing images
    - Allows anonymous uploads to the images bucket
    - Adds policies for updating and deleting images
    
  Note: Uses DO blocks to check if policies exist before creating them
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public Access'
  ) THEN
    create policy "Public Access"
      on storage.objects for select
      using ( bucket_id = 'images' );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Anyone can upload images'
  ) THEN
    create policy "Anyone can upload images"
      on storage.objects for insert
      with check (
        bucket_id = 'images' 
        and length(name) > 1
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Anyone can update their own images'
  ) THEN
    create policy "Anyone can update their own images"
      on storage.objects for update
      using ( bucket_id = 'images' );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Anyone can delete their own images'
  ) THEN
    create policy "Anyone can delete their own images"
      on storage.objects for delete
      using ( bucket_id = 'images' );
  END IF;
END $$;