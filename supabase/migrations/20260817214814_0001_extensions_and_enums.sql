-- Phase 1: Foundation. Extensions and shared enums.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type account_type as enum ('pending', 'staff', 'client', 'contractor');

create type classification_level as enum (
  'public', 'client', 'internal', 'confidential', 'restricted'
);

create type profile_status as enum ('active', 'disabled');
