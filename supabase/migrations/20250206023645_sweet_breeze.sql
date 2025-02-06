/*
  # Create URLs table for URL shortener

  1. New Tables
    - `urls`
      - `id` (uuid, primary key)
      - `short_url` (text, unique) - The generated short URL code
      - `long_url` (text) - The original long URL
      - `created_at` (timestamp)
      - `clicks` (integer) - Track number of clicks
      - `user_ip` (text) - Store user IP for history grouping
  
  2. Security
    - Enable RLS on `urls` table
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url text UNIQUE NOT NULL,
  long_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  clicks integer DEFAULT 0,
  user_ip text NOT NULL
);

-- Enable RLS
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- Allow public to insert new URLs
CREATE POLICY "Anyone can create URLs"
  ON urls
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to read URLs
CREATE POLICY "Anyone can read URLs"
  ON urls
  FOR SELECT
  TO public
  USING (true);

-- Allow updates for click counting
CREATE POLICY "Allow click updates"
  ON urls
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);