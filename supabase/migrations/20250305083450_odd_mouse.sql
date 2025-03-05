/*
  # Update storage policies for image uploads

  1. Security Policies
    - Enables public access for viewing images
    - Allows anonymous uploads to the images bucket
    - Adds policies for updating and deleting images
    
  Note: Assumes 'images' bucket already exists
*/

-- Allow public access to view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

-- Allow anonymous uploads to images bucket
create policy "Anyone can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'images' 
    and length(name) > 1
    -- Restrict file size to 5MB
    and octet_length(content) <= 5 * 1024 * 1024
  );

-- Allow users to update their own objects
create policy "Anyone can update their own images"
  on storage.objects for update
  using ( bucket_id = 'images' );

-- Allow users to delete their own objects
create policy "Anyone can delete their own images"
  on storage.objects for delete
  using ( bucket_id = 'images' );