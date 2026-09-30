-- SmartQR Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
CREATE TYPE tier_name AS ENUM ('free', 'starter', 'growth');
CREATE TYPE device_category AS ENUM ('mobile_ios', 'mobile_android', 'desktop', 'tablet', 'other');

-- TABLES
CREATE TABLE public.profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email TEXT NOT NULL, full_name TEXT, stripe_customer_id TEXT UNIQUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE public.tiers (id tier_name PRIMARY KEY, name TEXT NOT NULL, price_monthly_cents INTEGER NOT NULL DEFAULT 0, price_yearly_cents INTEGER NOT NULL DEFAULT 0, max_active_codes INTEGER NOT NULL DEFAULT 0, has_analytics BOOLEAN NOT NULL DEFAULT FALSE, has_logo_upload BOOLEAN NOT NULL DEFAULT FALSE, has_bulk_creation BOOLEAN NOT NULL DEFAULT FALSE, has_custom_domain BOOLEAN NOT NULL DEFAULT FALSE, has_team_access BOOLEAN NOT NULL DEFAULT FALSE, max_seats INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE public.subscriptions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, tier tier_name NOT NULL REFERENCES public.tiers(id), status subscription_status NOT NULL DEFAULT 'active', stripe_subscription_id TEXT UNIQUE, stripe_price_id TEXT, current_period_start TIMESTAMPTZ, current_period_end TIMESTAMPTZ, cancel_at_period_end BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE public.dynamic_codes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, short_code TEXT NOT NULL UNIQUE, destination_url TEXT NOT NULL, title TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE, style_json JSONB DEFAULT '{}', logo_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX idx_dynamic_codes_short_code ON public.dynamic_codes(short_code);
CREATE INDEX idx_dynamic_codes_user_id ON public.dynamic_codes(user_id);
CREATE INDEX idx_dynamic_codes_is_active ON public.dynamic_codes(is_active);
CREATE TABLE public.scan_events (id BIGSERIAL PRIMARY KEY, code_id UUID NOT NULL REFERENCES public.dynamic_codes(id) ON DELETE CASCADE, client_ip TEXT, user_agent TEXT, device_category device_category, country TEXT, region TEXT, city TEXT, referrer TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX idx_scan_events_code_created ON public.scan_events(code_id, created_at DESC);
CREATE TABLE public.scan_daily_summaries (id BIGSERIAL PRIMARY KEY, code_id UUID NOT NULL REFERENCES public.dynamic_codes(id) ON DELETE CASCADE, date DATE NOT NULL, total_scans INTEGER NOT NULL DEFAULT 0, unique_scans INTEGER NOT NULL DEFAULT 0, device_breakdown JSONB DEFAULT '{}', location_breakdown JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(code_id, date));
CREATE INDEX idx_scan_daily_summaries_code_date ON public.scan_daily_summaries(code_id, date DESC);
CREATE TABLE public.custom_domains (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, domain TEXT NOT NULL UNIQUE, is_verified BOOLEAN NOT NULL DEFAULT FALSE, verification_token TEXT, created_at TIMESTAMPTZ DEFAULT NOW());

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own codes" ON public.dynamic_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own codes" ON public.dynamic_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own codes" ON public.dynamic_codes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own codes" ON public.dynamic_codes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can log scan events" ON public.scan_events FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can view own scan events" ON public.scan_events FOR SELECT USING (code_id IN (SELECT id FROM public.dynamic_codes WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own scan summaries" ON public.scan_daily_summaries FOR SELECT USING (code_id IN (SELECT id FROM public.dynamic_codes WHERE user_id = auth.uid()));
CREATE POLICY "Users manage own custom domains" ON public.custom_domains FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view tiers" ON public.tiers FOR SELECT USING (TRUE);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION can_create_code(p_user_id UUID) RETURNS BOOLEAN AS $$ DECLARE v_tier tier_name; v_max_codes INTEGER; v_current_codes INTEGER; BEGIN SELECT s.tier INTO v_tier FROM public.subscriptions s WHERE s.user_id = p_user_id AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1; IF v_tier IS NULL THEN v_max_codes := 0; ELSE SELECT t.max_active_codes INTO v_max_codes FROM public.tiers t WHERE t.id = v_tier; END IF; IF v_max_codes = 0 THEN RETURN FALSE; END IF; SELECT COUNT(*) INTO v_current_codes FROM public.dynamic_codes WHERE user_id = p_user_id AND is_active = TRUE; RETURN v_current_codes < v_max_codes; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_scan_summary(code_id_param UUID) RETURNS TABLE (total_scans BIGINT, unique_visitors BIGINT, today_scans BIGINT, this_week BIGINT, this_month BIGINT) AS $$ BEGIN RETURN QUERY SELECT COUNT(*)::BIGINT, COUNT(DISTINCT client_ip)::BIGINT, COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT, COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT, COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::BIGINT FROM scan_events WHERE code_id = code_id_param; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed tiers
INSERT INTO public.tiers (id, name, price_monthly_cents, price_yearly_cents, max_active_codes, has_analytics, has_logo_upload, has_bulk_creation, has_custom_domain, has_team_access, max_seats) VALUES ('free', 'Free', 0, 0, 0, FALSE, FALSE, FALSE, FALSE, FALSE, 1), ('starter', 'Starter', 900, 7900, 3, TRUE, TRUE, FALSE, FALSE, FALSE, 1), ('growth', 'Growth', 1900, 15900, 15, TRUE, TRUE, TRUE, FALSE, TRUE, 3) ON CONFLICT (id) DO NOTHING;
