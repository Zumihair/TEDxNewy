-- Video support for social posts (Buffer publishes video to Instagram,
-- Facebook and LinkedIn; a single video on Instagram goes out as a Reel).
-- Apply by hand in the Supabase SQL editor before deploying.
-- Safe to re-run. Short lines on purpose: long lines got CRLF corrupted before.

-- `image_url` keeps its name and now holds the video URL too, rather than
-- adding a second nullable column that every reader would have to coalesce.
-- media_type is what tells them apart. Existing rows are all images.
alter table public.social_post_media
  add column if not exists media_type text not null default 'image';

alter table public.social_post_media
  drop constraint if exists social_post_media_type_check;

alter table public.social_post_media
  add constraint social_post_media_type_check
  check (media_type in ('image', 'video'));

-- A post carries either one video or up to N images, never both, because
-- that is what Instagram accepts. Enforced in the admin (addMedia refuses
-- the mix) and here as the backstop: at most one video row per post.
create unique index if not exists social_post_media_one_video_idx
  on public.social_post_media (post_id)
  where media_type = 'video';
