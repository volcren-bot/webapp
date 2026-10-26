# Agent notes

- Always size things in `rem` (font sizes, spacing, widths), never `px`. This includes arbitrary Tailwind values, e.g. `text-[0.5rem]`, not `text-[8px]`.
- Performance, stability and security are the number one priority of VOLCREN. Code must be the best in all three: validate and sanitize untrusted input, never trust or inject raw user/DB content, handle errors explicitly, and avoid unnecessary work or client-side JS (prefer server-side and cached computation).
