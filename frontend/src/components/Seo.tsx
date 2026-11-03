/*
 * Per-page <head> tags. React 19 hoists <title>, <meta> and <link> rendered anywhere
 * into <head>, so a page just renders <Seo ... /> at the top.
 *
 * Note: the app is client-rendered. Google runs JavaScript and picks these up; most
 * link-preview bots (WhatsApp, Facebook) do not, and only see the defaults in index.html.
 */

const SITE = 'UniConnect';
const DEFAULT_DESCRIPTION =
  'Student events in one place: concerts, hackathons, career fairs and parties. Buy tickets in a few taps and show the QR code at the door.';
const DEFAULT_IMAGE = '/mock/events/hero.webp';

interface SeoProps {
  /** Page name; becomes "Title | UniConnect". Omit on the home page. */
  title?: string;
  description?: string;
  /** Absolute or root-relative image for link previews. */
  image?: string;
  /** Private or utility pages: keep them out of search results. */
  noindex?: boolean;
  type?: 'website' | 'article';
}

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  noindex = false,
  type = 'website',
}: SeoProps) {
  const fullTitle = title
    ? `${title} | ${SITE}`
    : `${SITE}: student events, tickets and QR check-in`;
  const url = `${location.origin}${location.pathname}`;
  // data: URLs (organizer uploads in mock mode) are not shareable.
  const imageUrl = image.startsWith('data:')
    ? `${location.origin}${DEFAULT_IMAGE}`
    : new URL(image, location.origin).href;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

      <meta property="og:site_name" content={SITE} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content="en_GB" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </>
  );
}
