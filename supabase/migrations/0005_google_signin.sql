-- ============================================================
-- Google sign-in support.
--
-- A Google account arrives with an email and nothing else, so a student's
-- roll number can no longer be required at the moment the profile is created.
-- It is collected once, on first sign-in, at /welcome — and it stays unique,
-- so it remains a valid way to log in and a reliable way for staff to
-- identify a student.
-- ============================================================

alter table profiles drop constraint if exists students_need_student_id;

-- Google gives us a display name and avatar; keep whichever we're handed.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, phone, full_name, student_id, role)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      ''
    ),
    nullif(new.raw_user_meta_data ->> 'student_id', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- A student may set their own student ID exactly once. After that it is
-- fixed, so it cannot be swapped to impersonate someone else at the counter.
create or replace function guard_student_id() returns trigger
language plpgsql as $$
begin
  if old.student_id is not null
     and new.student_id is distinct from old.student_id
     and not is_admin() then
    raise exception 'your student ID cannot be changed — ask the canteen admin'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

create trigger trg_profiles_student_id
  before update on profiles
  for each row execute function guard_student_id();
