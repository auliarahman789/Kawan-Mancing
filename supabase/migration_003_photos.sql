-- Jalankan di SQL Editor (setelah migration_002)
alter table catches
  add column if not exists photo_path text,
  add column if not exists sha256 text,
  add column if not exists phash bit(64),
  add column if not exists lat double precision,
  add column if not exists lng double precision;
create index if not exists catches_sha256_idx on catches (sha256);

-- Bucket foto (publik untuk dibaca; hanya pemilik yang bisa upload/hapus di foldernya)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catches', 'catches', true, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create policy "catch photos upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'catches' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "catch photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'catches' and (storage.foldername(name))[1] = auth.uid()::text);

-- Validasi di server: sesi aktif, dekat spot, bukan foto duplikat
create or replace function check_catch() returns trigger
language plpgsql security definer set search_path = public as $$
declare s record; d double precision;
begin
  select st.status, sp.lat, sp.lng into s
    from sessions st join spots sp on sp.id = st.spot_id
    where st.id = new.session_id and st.user_id = new.user_id;
  if not found or s.status <> 'active' then raise exception 'Sesi tidak aktif'; end if;
  if new.lat is null or new.lng is null then raise exception 'Lokasi GPS wajib aktif'; end if;
  d := 6371000 * 2 * asin(sqrt(
        power(sin(radians(new.lat - s.lat) / 2), 2) +
        cos(radians(s.lat)) * cos(radians(new.lat)) * power(sin(radians(new.lng - s.lng) / 2), 2)));
  if d > 1000 then raise exception 'Kamu terlalu jauh dari spot (% m)', round(d); end if;   -- radius 1 km
  if new.sha256 is not null and exists (select 1 from catches where sha256 = new.sha256) then
    raise exception 'Foto ini sudah pernah diupload';
  end if;
  if new.phash is not null and exists (
       select 1 from catches where phash is not null
         and length(replace((phash # new.phash)::text, '0', '')) <= 4) then   -- selisih <=4 dari 64 bit = mirip
    raise exception 'Foto sangat mirip dengan foto yang sudah ada';
  end if;
  return new;
end $$;
create trigger trg_check_catch before insert on catches for each row execute function check_catch();
