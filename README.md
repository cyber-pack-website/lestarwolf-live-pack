# LESTARWOLF Live Pack V2

Hosted OBS Browser Source overlay for the LESTARWOLF Kick channel.

OBS URL: `https://lestarwolf-live-pack.onrender.com/overlay/`

V2 keeps the existing Kick OAuth, webhook, WebSocket, and Render configuration. The new front end adds asset-driven wolf animation, stable per-viewer looks, real roaming, pack reactions, crowd spacing, and 15-minute walk-off.

Pack progression:
- Viewers earn 5 XP from an eligible chat message and 3 bonus XP when that message is a wolf command.
- XP has a 60-second per-viewer cooldown to prevent spam.
- Levels, ranks, profile pictures, and XP persist in the OBS browser source between streams.
- The overlay shows the all-time Top 5 Pack Members.
- Higher ranks grow slightly and gain brighter rank-colored nameplates.
- Ranks: Newborn Pup, Pack Pup, Trail Scout, Night Hunter, Pack Guardian, Moon Warrior, Alpha Wolf, and Cyber Pack Legend.
- Test wolves never earn XP or enter the leaderboard.

Viewer chat commands:
- `!howl` — make your wolf howl
- `!sit` — make your wolf sit
- `!sleep` — put your wolf to sleep
- `!treat` — toss your wolf a treat

Owner-only testing commands:
- `!testwolf` — add one test wolf
- `!testpack` — add five test wolves

Required host secrets:
- `PUBLIC_URL`
- `KICK_CLIENT_ID`
- `KICK_CLIENT_SECRET`

Never commit the Kick client secret to GitHub.
