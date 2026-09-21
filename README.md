# LESTARWOLF Live Pack V2

Hosted OBS Browser Source overlay for the LESTARWOLF Kick channel.

OBS URL: `https://lestarwolf-live-pack.onrender.com/overlay/`

V2 keeps the existing Kick OAuth, webhook, WebSocket, and Render configuration. The new front end adds asset-driven wolf animation, stable per-viewer looks, real roaming, pack reactions, crowd spacing, and 15-minute walk-off.

Viewer chat commands:
- `!howl` — make your wolf howl
- `!sit` — make your wolf sit
- `!sleep` — put your wolf to sleep
- `!treat` — toss your wolf a treat

Required host secrets:
- `PUBLIC_URL`
- `KICK_CLIENT_ID`
- `KICK_CLIENT_SECRET`

Never commit the Kick client secret to GitHub.
