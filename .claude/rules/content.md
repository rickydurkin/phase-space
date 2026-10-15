---
paths:
  - "content/**"
---
# Content rules (MASTER 2.11, 2.12, 2.13, 7)

- en-GB spelling and conventions: DD/MM/YYYY, 24-hour clock, degrees C, metres, kilograms. Plain hyphens, straight quotes, no emoji. `npm run lint:content` enforces the character and word rules.
- No human or animal targets and no catalogue of real-world firearms. Projectiles come from sport, engineering, space, weather and history.
- A mission counts as content only when `npm run missions:verify` shows: goal not met at setup, references pass, traps fail, the guessing bot fails (MASTER 7.6).
- Every number shown to the player is tagged computed, anchored or estimated; every setting carries a reality badge.
- IDs are stable and never reused; retire rather than delete.
