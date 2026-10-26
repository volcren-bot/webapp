-- Minimal schema expected by the template. Run it in the Supabase SQL editor
-- (or put it in a migration) after creating your project.

create type public.roles as enum ('user', 'administrator');

create table public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	username text not null default '',
	avatar text not null default '',
	role public.roles not null default 'user'
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by their owner"
	on public.profiles for select
	using ((select auth.uid()) = id);

create policy "Users can update their own profile"
	on public.profiles for update
	using ((select auth.uid()) = id)
	with check ((select auth.uid()) = id);

-- Users must not be able to promote themselves, so only username/avatar are updatable.
revoke update on public.profiles from authenticated;
grant update (username, avatar) on public.profiles to authenticated;

-- Create a profile whenever a user signs up (OAuth or email).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
	insert into public.profiles (id, username, avatar)
	values (
		new.id,
		coalesce(
			new.raw_user_meta_data ->> 'user_name',
			new.raw_user_meta_data ->> 'full_name',
			split_part(new.email, '@', 1),
			''
		),
		coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
	);
	return new;
end;
$$;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();
