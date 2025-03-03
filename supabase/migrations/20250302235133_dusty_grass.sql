/*
  # Create volunteers table

  1. New Tables
    - `volunteers`
      - `id` (uuid, primary key)
      - `role_id` (uuid, references roles.id)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `description` (text)
      - `user_id` (uuid, references users.id)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `volunteers` table
    - Add policy for authenticated users to read volunteers
    - Add policy for authenticated users to create volunteers
    -