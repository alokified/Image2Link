/*
  # Create images table for storing uploaded image metadata

  1. New Tables
    - `images`
      - `id` (uuid, primary key)
      - `url` (text, not null) - The public URL of the image
      - `filename` (text, not null) - Original filename
      - `created_at` (timestamptz) - Upload timestamp
      
  2. Security
    - Enable RLS on images table
    - Add policy for public read access
*/

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  filename text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON images
  FOR SELECT
  TO public
  USING (true);

-- Allow inserts
CREATE POLICY "Allow public insert"
  ON images
  FOR INSERT
  TO public
  WITH CHECK (true);