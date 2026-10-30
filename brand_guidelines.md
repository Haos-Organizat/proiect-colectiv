# UniConnect Brand Guidelines

Brand direction: **01 Ember**. The live reference page with every token, component and example screen is [`design/brand/01-ember/index.html`](design/brand/01-ember/index.html). If this file and the reference page disagree, this file wins.

UniConnect is the student events app: browse events, create an account, buy tickets, and show your ticket as a QR code at the door (tickets are also emailed). The brand is loud on the poster and calm in the checkout: heavy type, warm blacks and creams, one ember accent, and nothing that blinks.

---

## 1. Hard rules

These apply to every screen, component, email and piece of copy. Reviewers should reject PRs that break them.

1. **No em dashes and no bullet point characters (U+2022)** in copy, CSS `content`, or code comments. Use commas, colons, periods or plain hyphens.
2. **No gradients** unless there is a real functional need (for example a scrim that keeps text readable over a photo). Decorative gradients are not allowed.
3. **No live activity indicators.** No pulsing dots, blinking "live" badges, breathing elements, marquees, or any animation with `infinite` iterations.
4. **Phosphor icons only**, used plain. Never put an icon inside a bordered box, a circle, or a tinted background chip. An icon sits next to text or alone.
5. **Mobile first.** Design and build at 375px wide first, then scale up.
6. **Inputs are at least 16px.** Every `input`, `select` and `textarea` uses `font-size: 16px` or larger so iOS Safari never zooms on focus. Do not "fix" zoom with `maximum-scale` or `user-scalable=no`.
7. **Every form validates on the frontend** with visible inline feedback (see section 7).
8. **One accent.** Ember is the only accent color. Do not add a second brand color.
9. **Light and dark mode** are both first-class. Every token below has a value for both.

---

## 2. Tech foundation

| Concern | Choice |
| :--- | :--- |
| Components | shadcn/ui (Radix primitives, copied into `frontend/src/components/ui/`) |
| Styling | Tailwind CSS, theme driven by the CSS variables in section 3 |
| Icons | Phosphor (`@phosphor-icons/react`) |
| Forms | React Hook Form + Zod (schemas live in `frontend/src/types/`) |
| Fonts | Google Fonts: Archivo, Schibsted Grotesk, IBM Plex Mono |

Theme switching: the `dark` class on `<html>` turns on dark mode (shadcn convention). On first visit follow `prefers-color-scheme`; once the user picks a theme, store it and apply it before first paint to avoid a flash. The switch is instant, never animated.

---

## 3. Color

Warm blacks, warm cream, one ember. Never use pure `#000000` or `#FFFFFF` for surfaces (the QR code is the one exception, see section 8).

### Tokens

Token names follow shadcn/ui. `primary-text`, `primary-hover`, `secondary-hover`, `destructive-hover`, `success` and `success-foreground` are UniConnect additions.

| Token | Light | Dark | Use |
| :--- | :--- | :--- | :--- |
| `background` | `#F4EEE3` | `#0B0A09` | Page background |
| `foreground` | `#17130F` | `#F4EEE3` | Body text |
| `card` | `#FBF7F0` | `#17130F` | Cards, inputs, sheets |
| `card-foreground` | `#17130F` | `#F4EEE3` | Text on cards |
| `muted` | `#E9E1D3` | `#211C17` | Quiet surfaces, disabled fields |
| `muted-foreground` | `#5E554B` | `#A39A8E` | Secondary text, labels, icons |
| `primary` | `#FF5B22` | `#FF5B22` | Ember: main action fills |
| `primary-foreground` | `#17130F` | `#0B0A09` | Label on ember (always dark ink) |
| `primary-hover` | `#E84A12` | `#FF7240` | Ember hover |
| `primary-text` | `#A8330B` | `#FF5B22` | Ember used as text: links, dates, accent words |
| `secondary` | `#17130F` | `#F4EEE3` | Inverse buttons and inverse sections |
| `secondary-foreground` | `#F4EEE3` | `#0B0A09` | Text on secondary |
| `secondary-hover` | `#2E2720` | `#E3DACB` | Secondary hover |
| `accent` | `#E9E1D3` | `#241E18` | Ghost button hover, selected rows |
| `accent-foreground` | `#17130F` | `#F4EEE3` | Text on accent |
| `border` | `#D9CFBF` | `#2E2720` | Dividers, card borders |
| `input` | `#8C8174` | `#6E6458` | Field borders |
| `ring` | `#A8330B` | `#FF5B22` | Focus outline |
| `destructive` | `#B0173A` | `#FF6B85` | Errors, destructive actions |
| `destructive-foreground` | `#FFFFFF` | `#0B0A09` | Text on destructive |
| `destructive-hover` | `#921230` | `#FF8A9E` | Destructive hover |
| `success` | `#1E7A46` | `#4FD18B` | Confirmations |
| `success-foreground` | `#FFFFFF` | `#0B0A09` | Text on success |

### Contrast (checked)

| Pair | Light | Dark |
| :--- | :--- | :--- |
| foreground on background | 16.0 : 1 | 17.1 : 1 |
| muted-foreground on background | 6.3 : 1 | 7.1 : 1 |
| primary-text on background | 5.8 : 1 | 6.4 : 1 |
| primary-foreground on primary | 6.0 : 1 | 6.4 : 1 |
| destructive on background | 6.0 : 1 | 7.2 : 1 |
| success on background | 4.6 : 1 | 10.2 : 1 |
| input border on background (3:1 needed) | 3.3 : 1 | 3.4 : 1 |
| ring on background (3:1 needed) | 5.8 : 1 | 6.4 : 1 |

### Color rules

- **White text on ember fails (3.0 : 1).** Ember buttons and badges always use dark ink labels, in both themes.
- When ember is text on a light surface, use `primary-text` (`#A8330B`), never `primary`.
- Use ember for **one thing per view**: the main action, or the key word in a headline. If everything is ember, nothing is.
- Errors always pair `destructive` color with text and an icon. Color alone never carries meaning.

### CSS variables (Tailwind v4 + shadcn)

```css
:root {
  --background: #F4EEE3;
  --foreground: #17130F;
  --card: #FBF7F0;
  --card-foreground: #17130F;
  --popover: #FBF7F0;
  --popover-foreground: #17130F;
  --muted: #E9E1D3;
  --muted-foreground: #5E554B;
  --primary: #FF5B22;
  --primary-foreground: #17130F;
  --primary-hover: #E84A12;
  --primary-text: #A8330B;
  --secondary: #17130F;
  --secondary-foreground: #F4EEE3;
  --secondary-hover: #2E2720;
  --accent: #E9E1D3;
  --accent-foreground: #17130F;
  --border: #D9CFBF;
  --input: #8C8174;
  --ring: #A8330B;
  --destructive: #B0173A;
  --destructive-foreground: #FFFFFF;
  --destructive-hover: #921230;
  --success: #1E7A46;
  --success-foreground: #FFFFFF;
  --radius: 16px;
}

.dark {
  --background: #0B0A09;
  --foreground: #F4EEE3;
  --card: #17130F;
  --card-foreground: #F4EEE3;
  --popover: #17130F;
  --popover-foreground: #F4EEE3;
  --muted: #211C17;
  --muted-foreground: #A39A8E;
  --primary: #FF5B22;
  --primary-foreground: #0B0A09;
  --primary-hover: #FF7240;
  --primary-text: #FF5B22;
  --secondary: #F4EEE3;
  --secondary-foreground: #0B0A09;
  --secondary-hover: #E3DACB;
  --accent: #241E18;
  --accent-foreground: #F4EEE3;
  --border: #2E2720;
  --input: #6E6458;
  --ring: #FF5B22;
  --destructive: #FF6B85;
  --destructive-foreground: #0B0A09;
  --destructive-hover: #FF8A9E;
  --success: #4FD18B;
  --success-foreground: #0B0A09;
}
```

---

## 4. Typography

| Role | Font | Notes |
| :--- | :--- | :--- |
| Display and headings | **Archivo** (variable, width 62 to 125, weight 100 to 900) | Heavy weights, slightly expanded width, tight leading |
| Body and UI | **Schibsted Grotesk** | Paragraphs, buttons, form labels |
| Data | **IBM Plex Mono** (400, 500, 600) | Dates, times, prices, ticket codes, small uppercase labels |

Google Fonts URL:

```
https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@400;500;600&family=Schibsted+Grotesk:wght@400..900&display=swap
```

Font stacks:

```css
--font-display: "Archivo", "Arial Narrow", system-ui, sans-serif;
--font-body: "Schibsted Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif;
--font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
```

### Type scale

Sizes scale fluidly from mobile (375px) to desktop with `clamp()`.

| Style | Font | Size (mobile to desktop) | Weight | Width | Line height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Display | Archivo, uppercase | `clamp(48px, 7vw + 22px, 104px)` | 900 | 112% | 0.9 | -0.02em |
| H1 | Archivo | `clamp(36px, 4vw + 21px, 64px)` | 850 | 108% | 0.95 | -0.015em |
| H2 | Archivo | `clamp(28px, 2.4vw + 19px, 44px)` | 800 | 104% | 1 | -0.01em |
| H3 | Archivo | `clamp(22px, 1vw + 18px, 28px)` | 760 | 100% | 1.1 | 0 |
| H4 | Archivo | `clamp(18px, 0.4vw + 16.5px, 20px)` | 700 | 100% | 1.2 | 0 |
| Body | Schibsted Grotesk | 16px, 17px from 1024px | 400 | | 1.55 | 0 |
| Small | Schibsted Grotesk | 14px | 400 | | 1.45 | 0 |
| Label | IBM Plex Mono, uppercase | 12px, 13px from 1024px | 500 | | 1.3 | 0.08em |

### Type rules

- Let headlines run big on mobile too. That is the poster feel.
- Numbers that people compare or read at the door (prices, dates, seat numbers, ticket codes) go in IBM Plex Mono.
- Labels in mono uppercase are for metadata only, never for sentences.
- Body text never goes below 14px. Form fields never go below 16px.

---

## 5. Logo and favicon

### Wordmark

"UniConnect" as one word in Archivo 900, width 115%, letter spacing -0.035em. "Uni" is in `primary-text`, "Connect" in `foreground`, followed by a small square ember period (0.2em square in `primary`). The square period is the same square used in the favicon.

- Minimum size: 18px tall in the app bar (22px font size).
- Never stretch, outline, add shadows or recolor the wordmark beyond the two tokens above.
- On an ember background the whole wordmark switches to dark ink.

### Favicon

File: [`design/brand/01-ember/favicon.svg`](design/brand/01-ember/favicon.svg), also installed as `frontend/public/favicon.svg`.

A heavy dark U on an ember rounded square, with each arm capped by a separate square block: the U is the university, the two caps are the two people it connects.

- Background `#FF5B22`, mark `#0B0A09`, corner radius 7 on a 32 grid.
- Works the same on light and dark browser tabs, no theme switch inside the SVG.
- Check it at 16px whenever it changes: the gap between the caps and the U is about 1px at that size.
- For an Apple touch icon (180px), export the same SVG to PNG with no transparency.

---

## 6. Layout, shape and spacing

| Token | Value | Use |
| :--- | :--- | :--- |
| `radius-card` | 16px | Cards, tickets, sheets, dialogs |
| `radius-input` | 12px | Inputs and selects |
| `radius-pill` | 999px | Buttons, badges, filter tags |
| Page gutter | 16px mobile, 32px from 768px | Horizontal padding |
| Max content width | 1200px | Centered container |
| Section padding | 56px mobile, 88px from 768px | Vertical space between page sections |
| Touch target | 44px minimum, 48px for buttons and inputs | Everything tappable |

Breakpoints (mobile first, `min-width`): **768px** tablet, **1024px** desktop. Use Tailwind's `md` and `lg` for these.

Editorial layout: big headline, short lede, then content. Alternate cream and inverse (`secondary`) sections on marketing pages for rhythm. App screens (account, checkout, tickets) stay on `background` and keep it calm.

There must be no horizontal scroll at 375px. Grid and flex children that hold wide content need `min-width: 0`.

---

## 7. Components

### Buttons

Pill shape, 48px tall (40px for `sm`), Schibsted Grotesk 600 at 16px, 8px gap to an 18px icon.

| Variant | Fill | Label | Hover |
| :--- | :--- | :--- | :--- |
| Primary | `primary` | `primary-foreground` | `primary-hover` |
| Secondary | `secondary` | `secondary-foreground` | `secondary-hover` |
| Ghost | transparent | `foreground` | `accent` fill |
| Destructive | `destructive` | `destructive-foreground` | `destructive-hover` |

- Focus: 2px `ring` outline, 3px offset. Always visible on keyboard focus.
- Disabled: 45% opacity, `not-allowed` cursor, no hover change.
- One primary button per view. Use variants instead of stacking boolean props (`<Button variant="ghost" size="sm">`).

### Inputs and selects

- 48px tall, 14px horizontal padding, `card` fill, 1.5px `input` border, `radius-input`.
- Text 16px (hard rule). Placeholder in `muted-foreground`.
- Focus: border becomes `ring` plus a 3px soft ring (`ring` at 28% opacity).
- Labels sit above the field in Schibsted Grotesk 600, 15px. Hints below in 14px `muted-foreground`.
- Checkboxes are 22px with `accent-color: primary`.

### Form validation

Every form uses React Hook Form with a Zod schema and shows errors like this:

1. Validate a field **on blur**, validate everything **on submit**, and re-validate on change once a field has shown an error so the message clears as soon as it is fixed.
2. Show the error **inline under the field**: `destructive` text at 14px, weight 500, with a Phosphor `WarningCircle` (bold) icon in front.
3. Switch the field border to `destructive` and keep the focus ring in `destructive` while it is invalid.
4. Set `aria-invalid="true"` on the field and point `aria-describedby` at the error message id.
5. On submit with errors, move focus to the first invalid field.
6. Never rely on color alone and never show errors only in a toast.

Baseline rules used across the app:

| Field | Rule |
| :--- | :--- |
| Name | Required |
| Email | Required, valid email format |
| Password (register) | At least 8 characters, at least one number |
| Confirm password | Must match password |
| Ticket quantity | Whole number from 1 to 10 |

### Badges and tags

- Badges: pill, 26px tall, IBM Plex Mono 500, 12px, uppercase, 0.06em tracking. Variants: primary (ember fill), solid (`secondary`), outline (`input` border), muted, success (outline).
- Filter tags: pill, 40px tall, 1.5px `input` border, Schibsted Grotesk 600 at 14px. Selected tags use `secondary` fill.

### Event card

`card` fill, 1px `border`, `radius-card`, image on top, then a mono date in `primary-text`, the title in Archivo, and venue and price in `muted-foreground`. The whole card is one link.

### Ticket

`card` fill with a dashed tear line and half-circle notches between the header (event, date, seat) and the body (QR code, ticket code). The ticket code is IBM Plex Mono 600, 16px, 0.1em tracking.

---

## 8. QR codes

- Always **black `#0B0A09` on white `#FFFFFF`**, in both themes, so door scanners read them reliably.
- At least 196px square on mobile, with 12px of white quiet zone inside a 10px radius container.
- Show the ticket code in mono text under the QR as a fallback for manual check-in.
- Never tint, recolor, add a logo over, or animate the QR itself.

---

## 9. Icons

- Library: Phosphor (`@phosphor-icons/react`).
- Weight: **regular** by default, 18px next to body text, 24px for stand-alone icon buttons. **Bold** inside buttons and for error and status icons. **Fill** only for an active state (for example a saved event).
- Color: `muted-foreground` next to text, or inherit the text color inside buttons.
- Icon-only buttons need an `aria-label` and a 44px hit area, with no visible box or background at rest.
- Decorative icons get `aria-hidden="true"`.
- Never place icons in bordered boxes, circles or tinted chips.

Common icons: `Ticket`, `CalendarBlank`, `MapPin`, `Clock`, `QrCode`, `User`, `SignIn`, `SignOut`, `MagnifyingGlass`, `Funnel`, `ArrowRight`, `Envelope`, `Sun`, `Moon`, `WarningCircle`, `CheckCircle`, `X`.

---

## 10. Motion

Only four moments move. Everything else holds still. All motion is wrapped in `@media (prefers-reduced-motion: no-preference)`; with reduced motion, things appear instantly. Every animation runs **once**.

| Moment | Animation | Duration | Easing |
| :--- | :--- | :--- | :--- |
| Ticket reveal (My tickets, after purchase) | Fade in plus 16px rise, once when it enters view | 360ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Log in / Register switch | Panel fade plus 8px rise | 200ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Form result (purchase or sign-in confirmation) | Opacity only | 200ms | `ease-out` |
| Control feedback (buttons, tags, inputs) | Background, border, color and shadow transitions | 150ms | `ease` |

Never:

- Infinite animations of any kind (pulsing, breathing, shimmer, marquees, idle spinners).
- Parallax, scroll-jacking, or reveal-on-scroll for regular content.
- Scale or bounce effects on buttons.
- An animated theme switch.
- Shimmer loading. Use static skeleton blocks or a text label.

---

## 11. Imagery

- Real photos of student events: crowds, stages, people. Prefer warm light.
- Event images use `radius-card` and a fixed aspect ratio (16:9 in cards).
- Text over a photo needs a solid `secondary` panel behind it, or a functional scrim if a panel is impossible. That scrim is the only accepted gradient.
- Always set `width`, `height` and `alt` on images. Decorative images get `alt=""`.

---

## 12. Voice and copy

- Short, direct, friendly. Talk to students like a person handing out a flyer, not like a bank.
- Sentence case for buttons and headings ("Buy tickets", not "Buy Tickets"). Uppercase only for mono labels.
- Errors say what to do: "Enter an email like name@university.ro", not "Invalid input".
- Dates read clearly: `FRI 14 NOV, 21:00` in mono.
- Prices always show the currency: `45 RON`.
- No em dashes, no bullet point characters (U+2022), no exclamation marks in errors.

---

## 13. Do and don't

**Do**

- Use ember for one thing per view.
- Set headlines in Archivo 800 to 900 with tight leading, big on mobile too.
- Put dates, prices and ticket codes in IBM Plex Mono.
- Use `primary-text` whenever ember is text on a light surface.
- Keep dark ink labels on ember in both themes.
- Keep QR codes black on white in both themes.
- Show errors inline, under the field, with text and an icon.

**Don't**

- Put white text on ember.
- Add a second accent color or decorative gradients.
- Box icons in circles, squares or tinted chips.
- Use pure `#000` or `#FFF` for surfaces.
- Animate lists, cards or headings on scroll, or loop any animation.
- Set any input below 16px.
- Use em dashes or bullet point characters (U+2022) anywhere.
