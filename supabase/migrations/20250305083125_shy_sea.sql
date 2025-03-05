/*
  # Set up storage bucket for image uploads

  1. Storage
    - Creates a new public bucket named 'images'
    - Sets up storage security policies
  
  2. Security
    - Enables public access for viewing images
    - Restricts upload capabilities to authenticated users
*/

-- Create a new storage bucket for images
insert into storage.buckets (id, name, public)
values ('images', 'images', true);

-- Allow public access to view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

-- Allow authenticated users to upload images
create policy "Authenticated users can upload images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'images' AND length(name) > 1 );