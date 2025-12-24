/*
  # College Visit Report Generator Schema

  1. New Tables
    - `visits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `college_name` (text)
      - `visit_date` (date)
      - `location` (text) - GPS coordinates or address
      - `latitude` (numeric) - GPS latitude
      - `longitude` (numeric) - GPS longitude
      - `status` (text) - draft, completed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `photos`
      - `id` (uuid, primary key)
      - `visit_id` (uuid, references visits)
      - `photo_url` (text)
      - `caption` (text)
      - `created_at` (timestamptz)
    
    - `notes`
      - `id` (uuid, primary key)
      - `visit_id` (uuid, references visits)
      - `category` (text) - academics, campus, facilities, social, etc.
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `reports`
      - `id` (uuid, primary key)
      - `visit_id` (uuid, references visits)
      - `report_content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  college_name text NOT NULL,
  visit_date date NOT NULL,
  location text DEFAULT '',
  latitude numeric,
  longitude numeric,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visits"
  ON visits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visits"
  ON visits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visits"
  ON visits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visits"
  ON visits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  caption text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos of own visits"
  ON photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = photos.visit_id
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos to own visits"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = photos.visit_id
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos of own visits"
  ON photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = photos.visit_id
      AND visits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = photos.visit_id
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of own visits"
  ON photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = photos.visit_id
      AND visits.user_id = auth.uid()
    )
  );

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE NOT NULL,
  category text DEFAULT 'general',
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes of own visits"
  ON notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = notes.visit_id
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes to own visits"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = notes.visit_id
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes of own visits"
  ON notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = notes.visit_id
      AND visits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = notes.visit_id
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes of own visits"
  ON notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = notes.visit_id
      AND visits.user_id = auth.uid()
    )
  );

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE NOT NULL,
  report_content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports of own visits"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = reports.visit_id
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reports to own visits"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = reports.visit_id
      AND visits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reports of own visits"
  ON reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visits
      WHERE visits.id = reports.visit_id
      AND visits.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS visits_user_id_idx ON visits(user_id);
CREATE INDEX IF NOT EXISTS photos_visit_id_idx ON photos(visit_id);
CREATE INDEX IF NOT EXISTS notes_visit_id_idx ON notes(visit_id);
CREATE INDEX IF NOT EXISTS reports_visit_id_idx ON reports(visit_id);