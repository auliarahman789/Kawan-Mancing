-- Jalankan di SQL Editor (setelah schema.sql)
alter table profiles add column if not exists avatar text not null default '🎣';
grant update (nickname, avatar) on profiles to authenticated;   -- xp tetap hanya bisa diubah trigger
