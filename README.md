# Cyber Pack Wolf Game V4

A multi-streamer Kick chat game delivered as a private OBS Browser Source. Each connected streamer gets an isolated wolf pack, private overlay URL, dashboard, command page, event schedule, and saved viewer progression.

## Live URLs

- Public setup: `https://lestarwolf-live-pack.onrender.com/`
- Existing LESTARWOLF V3 overlay: `https://lestarwolf-live-pack.onrender.com/overlay/`
- Health check: `https://lestarwolf-live-pack.onrender.com/health`

The V3 URL remains available. V4 streamer overlays use an unguessable URL generated after Kick sign-in, such as `/overlay/PRIVATE_KEY`.

## Streamer setup

1. Open the public setup page and select **Connect with Kick**.
2. Approve the Kick permissions.
3. Copy the private OBS URL from the Control Den dashboard.
4. Add it to OBS as a Browser Source at **1920 × 1080**.
5. Enable **Control audio via OBS** so wolf howls can be heard.

The dashboard includes safe test buttons for wolves, the moon, bear boss, squirrel, skunk, and PvP. A public command page is generated for each connected streamer.

## Multi-streamer architecture

- Kick OAuth 2.1 with PKCE connects the streamer.
- Kick webhooks are verified with Kick's RSA public key and deduplicated by message ID.
- The webhook broadcaster ID selects the correct private overlay room.
- WebSockets keep chat events isolated between streamers.
- PostgreSQL stores streamer accounts, encrypted tokens, private overlay keys, and viewer progression.
- Boss, squirrel, and skunk schedules run only while the corresponding channel is live.
- The existing `/overlay/` route and legacy room remain intact for LESTARWOLF.

## Viewer progression and activities

Viewer wolves retain XP, levels, treats, records, loot, cosmetics, nameplates, and effects within their streamer's pack. Features include:

- Animated wolves that grow from a baby pup into Scout, Hunter, Guardian, Moon Warrior, Alpha, and Legend ranks
- Top 5 viewer-only leaderboard
- Moon rarity rolls and timed/permanent loot
- Bear boss fights, squirrel chases, skunk escapes, and PvP duels
- Pack jobs, treat shop, nameplates, and visual effects
- Viewer profile pictures and Kick names

The command page lists the active viewer commands. Main commands include `!howl`, `!sit`, `!sleep`, `!treat`, `!dig`, `!zoomies`, `!boop @viewer`, `!play @viewer`, `!stats`, `!duel @viewer`, `!accept`, `!chase`, `!run`, boss attacks, pack jobs, and shop commands.

## Environment variables

Required in production:

- `PUBLIC_URL` — public HTTPS origin, without a trailing slash
- `KICK_CLIENT_ID`
- `KICK_CLIENT_SECRET`
- `DATABASE_URL`
- `SESSION_SECRET` — long random value used to sign dashboard sessions
- `TOKEN_ENCRYPTION_KEY` — long random value used to encrypt Kick tokens at rest

Optional:

- `KICK_CHANNEL` — legacy overlay owner; defaults to `lestarwolf`
- `KICK_VERIFY_WEBHOOKS=false` — local development only
- `DEV_STREAMER` and `DEV_OVERLAY_KEY` — create a memory-only local test streamer

The Kick developer application must use `${PUBLIC_URL}/callback` as its OAuth redirect URL and `${PUBLIC_URL}/webhook` as its webhook endpoint.

## Local development

```bash
npm install
PUBLIC_URL=http://localhost:10000 \
DEV_STREAMER=TestStreamer \
KICK_VERIFY_WEBHOOKS=false \
npm start
```

Then open `http://localhost:10000/overlay/dev-overlay-key?demo=1`.

Never commit Kick client secrets, session secrets, token keys, or database credentials.
