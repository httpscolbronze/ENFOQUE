-- ENFOQUE AI - Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to prepare database tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. User Settings
create table if not exists public.user_settings (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    user_name text not null default 'Alex Vance',
    whatsapp_number text default '',
    daily_study_goal_hours numeric(3, 1) default 4.5,
    daily_screen_time_limit_hours numeric(3, 1) default 5.0,
    whatsapp_automated_reports boolean default true,
    whatsapp_time text default '21:30',
    theme text default 'dark',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Screen Time Logs (Daily App usage)
create table if not exists public.screen_time_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    log_date date not null default current_date,
    app_name text not null,
    category text not null default 'Other',
    minutes_used integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. App Limits
create table if not exists public.app_limits (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    app_name text not null,
    limit_minutes integer not null default 60,
    enabled boolean default true,
    unique(user_id, app_name)
);

-- 4. Study Subjects
create table if not exists public.study_subjects (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    target_hours numeric(4, 1) not null default 10.0,
    completed_hours numeric(4, 1) not null default 0.0,
    priority text check (priority in ('Urgent', 'High', 'Medium', 'Low')) default 'Medium',
    deadline date not null,
    notes text default '',
    color text default '#6366F1'
);

-- 5. Daily Goals
create table if not exists public.daily_goals (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    goal_date date not null default current_date,
    title text not null,
    target_label text not null,
    category text default 'wellness',
    completed boolean default false
);

-- 6. Row Level Security (RLS)
alter table public.user_settings enable row level security;
alter table public.screen_time_logs enable row level security;
alter table public.app_limits enable row level security;
alter table public.study_subjects enable row level security;
alter table public.daily_goals enable row level security;

create policy "Users can manage their own settings" on public.user_settings
    for all using (auth.uid() = user_id);

create policy "Users can manage their screen time logs" on public.screen_time_logs
    for all using (auth.uid() = user_id);

create policy "Users can manage their app limits" on public.app_limits
    for all using (auth.uid() = user_id);

create policy "Users can manage their study subjects" on public.study_subjects
    for all using (auth.uid() = user_id);

create policy "Users can manage their daily goals" on public.daily_goals
    for all using (auth.uid() = user_id);
