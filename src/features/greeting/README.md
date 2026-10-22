# Greeting

Owns the example greeting API and its input limit. No storage or external dependencies.

`GET /api/greeting?name=Ada` returns `{"message":"Hello, Ada!"}`.
Missing or blank names default to `contributor`. Trimmed names longer than
80 JavaScript string code units return HTTP 400 with an `error` message.

Run `npm test -- src/features/greeting` while changing this feature.
Routing belongs in `src/app.ts`; business behavior belongs here.
