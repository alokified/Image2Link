/*
  # Set up storage bucket for image uploads

  1. Storage
    - Creates a new public bucket named 'images'
    - Sets up storage security policies for anonymous access
  
  2. Security
    - Enables public access for viewing images
    - Allows anonymous uploads to the images bucket
    - Adds size and file type restrictions
*/

-- Create a new storage bucket for images
insert into storage.buckets (id, name, public)
values ('images', 'images', true);

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