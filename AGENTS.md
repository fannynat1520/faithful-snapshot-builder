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

- Use the shared FormSelect wrapper for form dropdowns so required validation, accessible names and glass styling stay consistent without changing dependent-field logic.
- Keep event time stored as HH:mm; explicit hour and minute options are presentation-only so sorting, alerts and existing records remain compatible.
- Scope form glass tokens and styling to dialogs and form controls so the main page and vacancy cards retain their existing design.
