/* MATHNEX runtime configuration (PUBLIC file: never put secrets here).
   Only the Supabase *anon* key belongs here — it is designed to be public and is protected by
   Row Level Security. NEVER paste a service_role key. You can edit this file directly, or let
   `npm run build` regenerate it from the SUPABASE_URL / SUPABASE_ANON_KEY / ADSENSE_CLIENT env vars
   (see scripts/gen-config.mjs and docs/SETUP.md). Leave a value empty to keep that feature off. */
window.MX_CONFIG = {
  siteUrl: "https://mathnex.pages.dev",
  supabaseUrl: "",          // e.g. "https://abcdxyz.supabase.co"
  supabaseAnonKey: "",      // Project Settings > API > anon public key
  premium: { enabled: false },   // flip to true only once a real payment flow writes public.entitlements
  ads: {
    adsenseClient: "",      // e.g. "ca-pub-1234567890123456" (only after AdSense approves the site)
    slots: { home: "", footer: "" }   // ad-unit IDs created in AdSense
  },
  affiliates: [],  // [{ title, description, url, merchant }]  — https links you are genuinely approved for
  sponsors: [],    // [{ title, description, url, sponsor }]
  products: []     // [{ title, description, price, url }]    — external checkout/download links
};
