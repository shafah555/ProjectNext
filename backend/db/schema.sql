-- ProjectNext database schema
-- Apply it either by:
--   1) Running `npm run db:migrate` from the backend/ folder (uses DATABASE_URL), or
--   2) Pasting this file into the Neon Console -> SQL Editor and running it

create extension if not exists "pgcrypto";

-- USERS ---------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  email varchar(255) unique not null,
  password_hash text not null,
  avatar_color varchar(20) default '#3A6B72',
  created_at timestamptz not null default now()
);

-- PROJECTS --------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name varchar(160) not null,
  description text default '',
  owner_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PROJECT MEMBERS (many-to-many, with role) -----------------------------
create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role varchar(20) not null default 'member', -- 'owner' | 'admin' | 'member'
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- TASKS -------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title varchar(200) not null,
  description text default '',
  status varchar(20) not null default 'todo', -- 'todo' | 'in_progress' | 'in_review' | 'done'
  priority varchar(10) not null default 'medium', -- 'low' | 'medium' | 'high' | 'urgent'
  assignee_id uuid references users(id) on delete set null,
  created_by uuid not null references users(id) on delete cascade,
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_assignee on tasks(assignee_id);

-- COMMENTS ------------------------------------------------------------------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_task on comments(task_id);

-- NOTIFICATIONS ----------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type varchar(40) not null, -- 'task_assigned' | 'comment_added' | 'project_invite' | 'task_updated'
  content text not null,
  project_id uuid references projects(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id, is_read);

-- Keep updated_at fresh -----------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated on projects;
create trigger trg_projects_updated before update on projects
for each row execute function set_updated_at();

drop trigger if exists trg_tasks_updated on tasks;
create trigger trg_tasks_updated before update on tasks
for each row execute function set_updated_at();