# LESTARWOLF Live Pack V3

Hosted OBS Browser Source overlay for the LESTARWOLF Kick channel.

OBS URL: `https://lestarwolf-live-pack.onrender.com/overlay/`

V3 keeps the existing Kick OAuth, webhook, WebSocket, and Render configuration while adding reliable pack-wide howls, targeted wolf interactions, zoomies, stats, command help, and an owner-only reset.

Pack progression:
- Viewers earn 5 XP from an eligible chat message and 3 bonus XP when that message is a wolf command.
- XP has a 60-second per-viewer cooldown to prevent spam.
- Levels, ranks, profile pictures, and XP persist in the OBS browser source between streams.
- The overlay shows the all-time Top 5 Pack Members.
- The streamer account is excluded so every leaderboard spot belongs to a viewer.
- Higher ranks grow slightly and gain brighter rank-colored nameplates.
- Ranks: Newborn Pup, Pack Pup, Trail Scout, Night Hunter, Pack Guardian, Moon Warrior, Alpha Wolf, and Cyber Pack Legend.
- Test wolves never earn XP or enter the leaderboard.

Viewer chat commands:
- `!howl` — make your wolf howl
- `!sit` — make your wolf sit
- `!sleep` — put your wolf to sleep
- `!treat` — toss your wolf a treat
- `!dig` — dig for funny loot, bonus XP, and rare cosmetics (10-minute cooldown)
- `!zoomies` — race around the entire screen for 8 seconds
- `!boop @viewer` — run over and boop another wolf
- `!play @viewer` — run over and wrestle with another wolf
- `!stats` — show your current level, XP, dig finds, and active moon-item count
- `!commands` — briefly show the main viewer commands
- `!leaderboard` or `!top5` — show the Top 5 Pack Members for 15 seconds

Moon event:
- A new sub, renewal, gifted sub(s), or 10+ Kicks gifted triggers a moon roll.
- The moon enters from the left, spins through White, Green, Blue, Purple, and Gold for 25 seconds, then lands on a weighted random color. Gold has a 3% chance.
- When the moon lands, it drops a saved item for the supporter: White/Green items last 24 hours, Blue/Purple items last 42 hours, and the Gold Moon Totem is permanent.
- Every wolf howls together, using LESTARWOLF's custom recording, whenever a new wolf joins the pack. `!howl` and moon events also play the recording. Enable audio for the OBS browser source to hear it.
- Active moon-loot icons stay beside the viewer's name instead of sitting on the wolf's body.
- Owner testing: `!testmoon` for a random roll, or `!testmoon gold` to preview the Gold landing.

Digging loot includes bones, giant steaks, old boots, squeaky ducks, skunks, empty holes, golden bones, and the rare Moon Crown. The squeaky duck is a funny find, not a cosmetic. Golden Collars have about a 0.8% drop chance and Moon Crowns about a 0.2% drop chance; both are saved and automatically equipped on the viewer's wolf.
The `LESTARWOLF` streamer account has no `!dig` cooldown; viewers keep the 10-minute cooldown.

Owner-only testing commands:
- `!testwolf` — add one test wolf
- `!testpack` — add five test wolves
- `!resetme` — reset only LESTARWOLF's level, XP, items, cosmetics, and cooldowns

The V3 deployment performs the requested one-time reset of LESTARWOLF's saved profile. Viewer progression is preserved.

Required host secrets:
- `PUBLIC_URL`
- `KICK_CLIENT_ID`
- `KICK_CLIENT_SECRET`

After adding the moon feature, visit `/setup` once more to grant the required Kicks permission and subscribe the overlay to the new Kick events.

Never commit the Kick client secret to GitHub.
