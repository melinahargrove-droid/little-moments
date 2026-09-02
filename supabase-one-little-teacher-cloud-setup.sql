-- One Little Teacher shared cloud foundation.
-- Run in the shared Supabase project SQL editor.
-- This bucket is private. Each authenticated user can only access objects whose first path segment is their own auth.uid().

insert into storage.buckets (id, name, public)
values ('one-little-teacher-backups', 'one-little-teacher-backups', false)
on conflict (id) do update set public = false;

create policy "OLT users can read own backups"
on storage.objects for select
to authenticated
using (
  bucket_id = 'one-little-teacher-backups'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "OLT users can insert own backups"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'one-little-teacher-backups'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "OLT users can update own backups"
on storage.objects for update
to authenticated
using (
  bucket_id = 'one-little-teacher-backups'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'one-little-teacher-backups'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "OLT users can delete own backups"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'one-little-teacher-backups'
  and (storage.foldername(name))[1] = auth.uid()::text
);
