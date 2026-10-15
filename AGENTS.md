<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Data access uses the browser Supabase client with RLS; patients/visits are scoped by `clinic_id` via `is_clinic_member()` — never broaden policies to all authenticated users (multi-clinic isolation).
- Public sign-up exists; a DB trigger on auth.users gives each new account its own private clinic, so new users never gain access to existing clinics. Joining an existing clinic is done manually via `clinic_members`.
