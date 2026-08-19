-- Public bucket for menu photos. Images are public (they are the menu);
-- only admins may write.
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "menu images are public"
  on storage.objects for select
  using (bucket_id = 'menu-images');

create policy "admins upload menu images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and is_admin());

create policy "admins replace menu images"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu-images' and is_admin());

create policy "admins delete menu images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images' and is_admin());
