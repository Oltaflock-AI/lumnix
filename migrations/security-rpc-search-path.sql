-- Fix SECURITY DEFINER RPCs: pin search_path to prevent search-path hijack.
-- These functions already have workspace membership authz (from security-rls-overhaul.sql)
-- but were missing SET search_path = public, which lets a user with CREATE
-- privileges shadow base tables via pg_temp.

ALTER FUNCTION rpc_gsc_overview(UUID, DATE, DATE) SET search_path = public;
ALTER FUNCTION rpc_ga4_overview(UUID, DATE, DATE) SET search_path = public;
