# Repertorio Musical Backend

Node.js backend services for the Repertorio Musical app.

## Stack

- Node.js
- TypeScript
- Fastify
- Cheerio
- Zod

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run test
npm run check
```

The development server runs on port `3333` by default.

## Endpoints

```txt
GET /health
POST /auth/register
POST /auth/login
GET /me
GET /search?q=:query
GET /artists/:artist/songs/:song
GET /repertories
POST /repertories
GET /repertories/:id
POST /repertories/:id/songs
DELETE /repertories/:id/songs/:songId
PATCH /repertories/:id/songs/:songId/key
```

Example:

```bash
curl "http://localhost:3333/search?q=coldplay%20yellow"
curl http://localhost:3333/artists/coldplay/songs/yellow
```

The Cifra Club endpoint fetches the public song page and extracts the chord
sheet from the server-rendered HTML. It does not use Selenium or Playwright.

The search endpoint uses Cifra Club's public suggestion endpoint and returns
likely matches.

Repertory endpoints use bearer authentication:

```bash
curl -X POST http://localhost:3333/auth/register \
  -H "content-type: application/json" \
  -d '{"username":"musico","password":"senha123"}'
```

Use the returned token as:

```txt
Authorization: Bearer <token>
```
