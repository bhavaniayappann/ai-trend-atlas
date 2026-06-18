-- Add custom topic metadata columns
alter table topics
  add column if not exists is_custom boolean not null default false,
  add column if not exists keywords text[] not null default '{}';

-- Mark existing manually-created topics (description prefix from earlier versions)
update topics
set is_custom = true
where description like 'Custom topic:%' and is_custom = false;
