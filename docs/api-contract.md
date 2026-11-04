# UniConnect API contract

What the frontend calls, what it sends, and what it expects back. If you build an endpoint, match this; if you need to change it, update this file and `frontend/src/types/api.ts` in the same PR.

A working reference already exists: `frontend/src/api/mock/server.ts` implements every endpoint below in the browser (run the frontend with `VITE_USE_MOCKS=true`). When in doubt, do what the mock does.

---

## 0. Status: what the Flask backend implements today

| Endpoint | Backend | Frontend |
| :--- | :--- | :--- |
| `POST /api/auth/register` | ✅ | connected (then logs in automatically) |
| `POST /api/auth/login` | ✅ | connected |
| `POST /api/auth/logout` | ✅ | connected |
| `GET /api/auth/me` | ✅ | connected |
| `POST /api/evenimente` (create event, organizer) | ✅ | connected |
| `GET /api/events`, `GET /api/events/:slug` | ❌ | shows "not available on the server yet" |
| `POST /api/orders` | ❌ | same |
| `GET /api/me/tickets`, `GET /api/me/tickets/:id` | ❌ | same |
| `GET /api/organizer/events`, `GET/PATCH /api/organizer/events/:id` | ❌ | same |
| `POST /api/organizer/uploads` | ❌ | photo upload fails; the photo is optional |

The implemented endpoints use the backend team's own field names (snake_case and Romanian, see section 3a). The frontend adapts to them in `frontend/src/api/flask.ts`, so **do not rename them** without updating that file. For endpoints still to build, sections 3b onwards describe what the frontend expects; if you prefer the snake_case/Romanian style for those too, agree on the shape with the frontend first and add an adapter next to the existing ones.

---

## 1. Conventions

| Topic | Rule |
| :--- | :--- |
| Base path | `/api` (what the existing blueprints use). |
| Hosts | The frontend only uses relative paths. Vite proxies `/api` to `localhost:5000` in dev, Vercel routes it to `backend/api/index.py` in prod. Same origin, so no CORS setup is needed. |
| Format | JSON in and out, `Content-Type: application/json`. Only the image upload is `multipart/form-data`. |
| Field names | `camelCase` in JSON (the database can stay `snake_case`, convert in the schema layer). |
| IDs | Strings. UUIDs are fine. |
| Dates | ISO 8601 with offset, e.g. `2026-11-14T21:00:00+02:00` or UTC `Z`. The frontend shows them in `Europe/Bucharest`. |
| Money | `{ "amount": 4500, "currency": "RON" }`. `amount` is an integer in minor units (bani): 4500 means 45.00 RON. `0` means a free event. Never send floats. |
| Empty success | `204 No Content` with no body. |

### Session (auth)

The frontend never stores tokens. After login or register, the backend sets the session in an **httpOnly, Secure, SameSite=Lax cookie** and the browser sends it automatically on every `/api` request (same origin). With Supabase Auth, keep the Supabase access/refresh tokens server side (in that cookie) and refresh them in the backend.

Any endpoint marked **auth** returns `401` when there is no valid session. Endpoints marked **organizer** also return `403` when the user's role is not `organizer`.

### Errors

The frontend (`frontend/src/api/client.ts`) understands all of these, so existing endpoints can keep their style:

| Body | Used by | Shown as |
| :--- | :--- | :--- |
| `{ "errors": { "email": "..." } }` | register, create event (400/409) | each message under its field |
| `{ "error": "Email sau parolă greșite" }` | login, auth guards (401/403) | message above the form |
| `{ "error": { "code", "message", "fields" } }` | recommended for new endpoints | both of the above |
| HTML 404 page | routes that do not exist yet | "This part of UniConnect is not available on the server yet." |

The recommended body for new endpoints:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Check the highlighted fields.",
    "fields": { "email": "An account with this email already exists." }
  }
}
```

- `code`: stable, snake_case, the frontend may branch on it.
- `message`: human readable, shown to the user as is. Write it like the UI copy: short, says what to do.
- `fields` (optional): per-field messages keyed by the **request** field name. The frontend shows each one under the matching input.

| Status | When | `code` examples |
| :--- | :--- | :--- |
| 400 | Malformed JSON | `bad_request` |
| 401 | Not logged in, wrong credentials | `unauthenticated`, `invalid_credentials` |
| 403 | Logged in but not allowed | `forbidden` |
| 404 | Unknown id or slug | `not_found` |
| 409 | Conflict with current state | `email_taken`, `sold_out`, `not_enough_tickets` |
| 413 | Upload too big | `file_too_large` |
| 422 | Validation failed | `validation_error` (with `fields`) |

---

## 2. Data shapes

These mirror `frontend/src/types/api.ts`.

```ts
User          { id, name, email, role: "student" | "organizer", university: string | null }

EventSummary  { id, slug, title, category, startsAt, endsAt, venue, city, imageUrl,
                price: Money, ticketsLeft }
EventDetail   EventSummary + { description, organizer: { id, name }, capacity, maxPerOrder }
OrganizerEvent EventDetail + { status: "draft" | "published" | "cancelled", ticketsSold, revenue: Money }

Ticket        { id, code, qrPayload, status: "valid" | "used" | "cancelled", holderName, purchasedAt,
                event: { id, slug, title, startsAt, venue, city, imageUrl } }
Order         { id, eventId, quantity, total: Money, tickets: Ticket[], emailedTo }
```

`category` is one of: `party`, `concert`, `tech`, `career`, `culture`, `sport`, `workshop`, `volunteering`.

`slug` is a URL-safe, unique version of the title (`campus-sound-night`), generated by the backend on create. Add `-2`, `-3` on collision.

---

## 3. Endpoints

### 3a. Implemented today

Shapes below are what the Flask app actually sends and accepts.

#### `POST /api/auth/register`
```json
{ "first_name": "Ples", "last_name": "Denisa", "email": "denisa.ples@stud.ubbcluj.ro",
  "password": "Campus2026", "confirm_password": "Campus2026",
  "birth_date": null, "phone": null }
```
- Validation (`backend/application/auth/validator.py`, mirrored in `frontend/src/types/schemas.ts`): first and last name required, max 30 chars; valid email; password at least 8 chars with an uppercase and a lowercase letter; `confirm_password` must match.
- **201** the user (below). Does **not** start a session; the frontend calls login right after.
- **400** `{ "errors": { field: message } }`, **409** `{ "errors": { "email": "Acest email este deja înregistrat." } }`.
- Every new account gets `role: "participant"`. To make an organizer, set `users.role = 'organizator'` in Supabase Studio (http://localhost:54323) until there is an admin flow.

User object returned by register, login and me:
```json
{ "id": 1, "email": "denisa.ples@stud.ubbcluj.ro", "first_name": "Ples", "last_name": "Denisa",
  "birth_date": null, "phone": null, "role": "participant", "status": "activ" }
```
`role` is `participant` or `organizator`; the frontend maps them to `student` and `organizer`.

#### `POST /api/auth/login`
`{ "email", "password", "remember"? }` → **200** user + Flask session cookie (httpOnly, SameSite=Lax). **401** `{ "error": "Email sau parolă greșite" }`.

#### `POST /api/auth/logout` (auth)
Clears the session. **200** `{ "message": "..." }`.

#### `GET /api/auth/me` (auth)
**200** user, **401** `{ "error": "Neautentificat" }` when logged out (the frontend treats it as "guest").

#### `POST /api/evenimente` (organizator)
```json
{ "titlu": "Campus Sound Night", "descriere": "Four student bands...", "categorie": "muzica",
  "data_ora": "2026-11-14T17:00:00.000Z", "loc": "Central Park Stage, Cluj-Napoca",
  "numar_locuri": 800, "poza": "https://..." }
```
- `categorie` must be one of `CATEGORII_PERMISE` in `backend/application/evenimente/validator.py`. The frontend sends `petrecere`, `muzica`, `tehnologie`, `cariera`, `cultura`, `sport`, `workshop`, `voluntariat`.
- `data_ora` in the future, `numar_locuri` 1 to 10,000, `poza` optional.
- **201** the event, saved in the `events` table. **400** `{ "errors": ... }`, **401** logged out, **403** not an organizer.
- Not stored yet although the form collects them: end time, price, max tickets per order, draft/published status.

---

### 3b. To build next

Sections below describe what the frontend calls for the remaining screens.

### Public events

#### `GET /api/events?category=&q=`
Home page (first 6) and the events list.
- Only `published` events whose `endsAt` is in the future.
- `category` (optional): one of the categories above.
- `q` (optional): case-insensitive match on title, venue and city.
- Sorted by `startsAt` ascending.
- **200** `EventSummary[]` (empty array when nothing matches, not 404).

Pagination is not needed yet. If you add it later, use `?limit=&cursor=` and tell the frontend.

#### `GET /api/events/:slug`
Event detail page.
- **200** `EventDetail`
- **404** if the slug does not exist or the event is not `published`.

---

### Orders and tickets

#### `POST /api/orders` (auth)
"Pay" / "Get free tickets" button on the event page.

```json
{ "eventId": "e_1", "quantity": 2 }
```

The backend must, **in one database transaction**:
1. Check the event is `published` and not over. Otherwise `404 not_found`.
2. Check `1 <= quantity <= maxPerOrder`. Otherwise `422` with `fields.quantity`.
3. Check `quantity <= ticketsLeft`. Otherwise `409 sold_out` (none left) or `409 not_enough_tickets` with `fields.quantity: "Only 3 tickets are left."`. Lock the event row (`SELECT ... FOR UPDATE`) so two buyers cannot oversell.
4. Take payment if `price.amount > 0` (see "Payments" below).
5. Create one `Ticket` per seat with:
   - `code`: short, human readable, unique, e.g. `UC-7F3K-2Q9M` (no 0/O/1/I to avoid misreads)
   - `qrPayload`: an opaque, **signed** string (e.g. an HMAC or JWT over ticket id + event id). The QR shows exactly this string; the door scanner will send it back to verify. It must not be guessable from the code.
   - `status: "valid"`, `holderName` from the user, `purchasedAt` now.
6. Decrease `ticketsLeft`, increase `ticketsSold`.
7. **Email the tickets** to the user's email (one email per order, each ticket with its QR image and code). Do this after the transaction commits; if email fails, keep the order and retry, do not fail the request.

- **201** `Order` (the frontend shows the new tickets right away and says "We also sent them to {emailedTo}")

**Payments:** no provider is chosen yet. Until it is, treat every order as paid. When one is added (e.g. Stripe or Netopia), this endpoint will likely return a checkout URL instead, and tickets are created by the payment webhook. Talk to the frontend before changing the response.

#### `GET /api/me/tickets` (auth)
My tickets page.
- All tickets of the logged-in user, any status, past events included (the frontend splits upcoming and past).
- Sorted by `event.startsAt` ascending.
- **200** `Ticket[]`

#### `GET /api/me/tickets/:id` (auth)
Single ticket (for a future full-screen QR view).
- **200** `Ticket`, **404** if it does not exist or belongs to someone else (do not return 403, it leaks existence).

---

### Organizer (organizer)

All of these only see events where `organizer.id` is the logged-in user.

#### `GET /api/organizer/events`
Organizer dashboard. All statuses, including drafts and cancelled.
- **200** `OrganizerEvent[]` sorted by `startsAt`.

#### `GET /api/organizer/events/:id`
Edit event page.
- **200** `OrganizerEvent`, **404** if not found or not theirs.

#### `POST /api/organizer/events`
Create event form ("Publish" or "Save draft").

```json
{
  "title": "Campus Sound Night",
  "category": "concert",
  "description": "Four student bands, one open-air stage...",
  "startsAt": "2026-11-14T18:00:00.000Z",
  "endsAt": "2026-11-14T22:00:00.000Z",
  "venue": "Central Park Stage",
  "city": "Cluj-Napoca",
  "imageUrl": "https://.../covers/abc.webp",
  "price": { "amount": 4500, "currency": "RON" },
  "capacity": 800,
  "maxPerOrder": 6,
  "status": "published"
}
```

Validation:
- `title` 4 to 90 chars, `description` 30 to 4000 chars
- `category` from the list
- `startsAt` in the future, `endsAt` after `startsAt`
- `venue`, `city` at least 2 chars
- `price.amount` integer `>= 0` (0 = free), at most 1,000,000 (10,000 RON)
- `capacity` integer 1 to 100,000
- `maxPerOrder` integer 1 to 10
- `imageUrl` required, must be a URL returned by the upload endpoint
- `status` is `draft` or `published`

The backend sets `id`, `slug`, `organizer`, `ticketsLeft = capacity`, `ticketsSold = 0`, `revenue = 0`.
- **201** `OrganizerEvent`, **422** with `fields` keyed by the names above (`title`, `price`, `capacity`, ...).

#### `PATCH /api/organizer/events/:id`
Edit form ("Save changes", "Save draft", "Publish") and "Cancel event". Body is any subset of the create fields, or just `{ "status": "cancelled" }`.
- Changing `capacity` below `ticketsSold` → `422` with `fields.capacity`.
- Cancelling: set `status: "cancelled"`, mark all its tickets `cancelled`, and **email every ticket holder**. Refunds are out of scope until payments exist.
- **200** the updated `OrganizerEvent`.

#### `POST /api/organizer/uploads`
Cover photo picker in the event form. `multipart/form-data` with one field `file`.
- Accept `image/jpeg`, `image/png`, `image/webp`, max 5 MB → otherwise `422` / `413 file_too_large` with `fields.file`.
- Store it (Supabase Storage bucket, public read) and return its public URL.
- **201** `{ "url": "https://..." }`

---

## 4. Not built in the frontend yet (plan for it)

| Feature | Suggested endpoint |
| :--- | :--- |
| Door check-in by scanning the QR | `POST /api/organizer/check-in` with `{ "qrPayload": "..." }` → verify signature, ticket belongs to one of the organizer's events, `status` is `valid`; set it to `used` and return the `Ticket`. `409 already_used` if scanned twice. |
| Password reset | `POST /api/auth/password-reset` with `{ "email" }`, always `204` (do not reveal if the email exists). Supabase emails land in Inbucket locally. |
| Resend ticket email | `POST /api/me/tickets/:id/resend` → `204`. |

## 5. Database

The schema lives in `supabase/migrations/` (`users`, `venues`, `events`, `ticket_types`, `tickets`), with row-level security enabled on every table: only the backend, using the service_role key, can read or write them.

Gaps to close before the remaining endpoints can work:

- `tickets` has `UNIQUE (user_id, event_id)`, so a user can hold only one ticket per event, while the purchase screen allows up to `maxPerOrder` (10). Drop the constraint or add an `orders` table and allow several tickets per order.
- Prices live in `ticket_types.price` (DECIMAL). The frontend works with one price per event in bani (integer); either create one ticket type per event or add `events.price_amount`.
- `events` has no `slug` (the event page URL uses one) and no `max_per_order`.
- `tickets` needs a signed QR payload column (for example `qr_secret`) next to `code`.
- `ticketsLeft` = `capacity` minus the event's tickets, and `revenue` = sum of the event's order totals; compute them, do not store them twice.
