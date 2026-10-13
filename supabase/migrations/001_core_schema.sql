-- ==============================================================================
-- Migration: 001_core_schema.sql
-- Description: Core relational schema for OrgOS multi-tenant architecture
-- ==============================================================================

-- 1. Create Role Enum
CREATE TYPE org_role AS ENUM ('president', 'treasurer', 'event_lead', 'officer', 'member');

-- 2. Organizations Table (Root tenant entity)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    university TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Organization Memberships (Many-to-Many join table)
CREATE TABLE IF NOT EXISTS org_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role org_role NOT NULL DEFAULT 'member',
    title TEXT, -- e.g., "Vice President", "Cultural Chair", "Faculty Advisor"
    is_active BOOLEAN NOT NULL DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (org_id, user_id)
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON org_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON org_memberships(user_id);
