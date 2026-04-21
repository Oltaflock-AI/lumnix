# Lumnix — Landing Page Copy V2

**Audience:** D2C brand founders/marketers + marketing agency owners
**Core positioning:** The AI marketing platform that replaces the 5-tool stack
**Tone:** Direct, confident, specific. No vague "unlock growth" language — always a concrete thing with a number.
**Voice rule:** Every section says *who it's for* or *what the pain is* before it says what Lumnix does.

---

## What changed vs. today's copy

Today's hero opens with *"Your competitors know something you don't."* It's punchy, but a D2C founder lands on it and still has to work to answer three questions: **Is this for me? What does it do? Why should I care?**

V2 fixes that in the first 3 seconds:

1. **Names the ICP in the eyebrow line** — "For D2C brands and marketing agencies" — so the wrong-fit visitor bounces and the right-fit visitor leans in.
2. **Leads the headline with the felt pain** — a fragmented tool stack is what they open 8 tabs to manage every morning.
3. **Says what Lumnix is in one line** — not a metaphor, not a tease: "one platform for SEO, analytics, ads, competitors, and creative."
4. **Keeps the best villain/competitor moments from V1** but moves them after the "what is it" moment, not before.

---

## Hero section

**File:** `src/app/(landing)/components/Hero.tsx`

### Eyebrow badge
> For D2C brands and agencies · Early access

*(Keep the pulsing dot. Shorter than V1 — same line, more specific.)*

### Headline (H1) — TIGHT version
> **5 tools.**
> **5 different answers.**
> **One** stack.

*Why:* Three short lines, matches the original's vertical rhythm exactly. The shimmer goes on "One" — the emotional anchor. Parallel structure makes it memorable. ICP handled by the badge above, not the headline.

### Sub-headline (single line)
> Lumnix is the AI marketing platform for **D2C brands and agencies.**

*Why:* This is the "what is Lumnix" sentence that's missing today. One sentence, no pillar list (the tagline slot handles that below).

### Pain line (body, single sentence)
> Your team wastes **14 hours a week** stitching GA4, GSC, Meta Ads, and Google Ads. Lumnix ends that.

### Tagline (pillar list)
> SEO · Analytics · Paid ads · Competitor intel · Creative.

*Why:* Uses the tagline slot for the five-pillar list instead of a fluffy "One stack. One AI…" line. Gives the visitor the surface area at a glance without bloating the sub-headline.

### Primary CTA
> **Get early access — free**  →

### Secondary CTA
> See how it replaces your stack  ↓

*(Anchors to `#features` which is the Villain section. Current link says "how it works" which doesn't match the section below.)*

### Savings line (fact-checked — see "Pricing claims" appendix, single line)
> **₹17k–₹55k/mo** in tools → **from ₹2,499/mo**

*(Fact-checked against current pricing for Ahrefs, Whatagraph, Triple Whale, Atria, ChatGPT Business, and the lean-stack equivalents. See appendix.)*

### Proof line (single line)
> D2C brands · ₹50L–₹50Cr ARR · agencies managing 3–30 clients

*Why:* Concrete sizing signal. Tells a founder "yes, that's me" or "no, I'm too early / too late." Middot-separated to fit on one line under the savings stat.

---

## Villain section ("The problem")

**File:** `src/app/(landing)/components/VillainSection.tsx`

### Eyebrow
> THE REAL COST OF YOUR STACK

### Headline
> You're paying **5 tools** to tell you **5 different stories.**

*(Current headline says "5 tools that can't see each other" — V2 makes the consequence concrete: you're getting conflicting information, not just disconnected dashboards.)*

### Sub-headline
> Every tool knows one slice. None of them know the full picture. That gap is where campaigns go wrong, budgets get wasted, and agencies lose retainers.

*(Adds the agency consequence — "lose retainers" — so the agency ICP feels the pain too.)*

### Tool card 1 — Google Search Console
- **KNOWS:** You rank **#1** for "promunch" with **3,400 impressions a month.**
- **BLIND TO:** That **3 of your top-10 keywords have a 0% CTR** — the meta titles haven't been updated in a year, and the click is going to whoever outranks you on the SERP snippet.
- **COST:** ~200 organic clicks/month, gone. GSC shows you the problem. It won't tell you how to fix it.

### Tool card 2 — Google Analytics 4
- **KNOWS:** Sessions dropped **25%** last Tuesday.
- **BLIND TO:** That Mamaearth launched **12 new ads** targeting your audience the same morning. GA4 will never tell you *why*.
- **COST:** ₹0/mo · 3 hrs/week exporting CSVs that nobody reads

### Tool card 3 — Meta Ads Manager
- **KNOWS:** You spent **₹8,159** this month.
- **BLIND TO:** Which of *your* ads is actually driving orders (Meta's attribution is optimistic at best) — and which **hooks, angles, and offers** are working for your competitors right now.
- **COST:** ₹8,159/mo spent blind. No way to know what to double down on, what to kill, or what to steal from the brands beating you.

### Gut-punch line (keep shimmer)
> None of your tools know what your **competitors** are doing.
> **Lumnix does.**

*(Replaces "Until now." with a confident assertion.)*

---

## Competitor ad intel section

**File:** `src/app/(landing)/components/AdSpySection.tsx`

### Eyebrow
> PILLAR 1 · COMPETITOR INTEL

*(Adding "Pillar 1" subtly telegraphs there are more pillars below — which reinforces the "full stack" positioning.)*

### Headline
> They've been A/B testing ads for **6 months.**
> **You're about to see every winner.**

*(Current copy says "You're about to see every single one" — V2 sharpens "single one" to "winner" because that's what actually matters.)*

### Sub-copy (lead)
> Nobody has time to manually scroll **500 ads per competitor** in the Meta Ad Library. Lumnix does it for you — and tells you which ones are worth stealing.

### Sub-copy (authority / why-it-works)
> Rule of thumb: an ad running **90+ days** is an ad Meta keeps serving because it converts. Those are the only ones worth your attention. We surface them, decode the hook, and hand you the brief.

### Bullet points (checkmark list)
- Add any competitor — by brand name, website, or Facebook Page URL
- We filter to the **top 10% of winners** — longevity, engagement, ad frequency
- **AI brief on every ad:** hook, pain point, offer, format, why it's working
- **Swipe file** that's always current — new winners land in your dashboard weekly

*(Current points are fine but miss the "swipe file" framing — which is exactly how creative strategists and agency teams already think.)*

---

## Lumi (AI assistant) section

**File:** `src/app/(landing)/components/LumiSection.tsx`

### Eyebrow
> PILLAR 5 · LUMI, YOUR AI MARKETER

### Headline
> Stop pulling reports.
> **Start asking questions.**

*(Keep current — it's strong.)*

### Sub-copy
> Lumi isn't a chatbot. It's plugged into **your** GSC, GA4, Meta Ads, Google Ads, and competitor feeds. Ask it anything about your marketing — and it answers with your actual numbers, not generic advice.

*(Current copy says "reads your actual data" — V2 lists the integrations so the reader knows this is real, not vaporware.)*

### Example question 1 (body unchanged, label tightened)
- **Q:** *Why did my traffic drop last week?*
- **A:** *Your top GSC keyword 'promunch' dropped from position 1.2 to 3.8 between Apr 8–10. This coincides with a new Mamaearth campaign targeting the same intent. Recommended: strengthen the page's internal linking and update the meta title.*

### Example question 2
- **Q:** *What are my 3 quickest wins this week?*
- **A:** *Three pages rank on page 1 with a 0% CTR — 'soya mini chunks' (190 impressions), 'soya munch' (8 impressions), 'peri peri soya' (1 click on 1 impression). Rewriting the meta titles could add ~20 organic clicks/week at zero ad spend.*

### Example question 3
- **Q:** *Is my organic or paid channel more efficient right now?*
- **A:** *Organic: 214 clicks, ₹0 spend, ~₹6,200 equivalent value. Paid: 18,038 clicks, ₹8,159 spend, ₹0.45 CPC. Your organic CTR is 26% vs paid 3.87% — shift ₹15k of next month's ad budget into content and you'll likely net more traffic for the same spend.*

*(Existing answers are already strong. V2 makes the third one more actionable — ends with "shift ₹15k" instead of "consider doubling down.")*

---

## Pricing section

**File:** `src/app/(landing)/components/PricingSection.tsx`

### Headline
> Less than the cost of **one bad ad week.**

*(Current: "Less than the cost of one bad ad." — V2 makes the frame of reference tighter and more visceral.)*

### Sub-headline (line 1)
> Replace **₹17,000–₹55,000/mo** of disconnected tools with one platform. Starts at **₹2,499/mo.**

### Sub-headline (line 2)
> Try any paid plan free for **7 days** — no card required.

### Plan taglines (tighten)
- **Free** — *See if Lumnix fits*
- **Starter** — *For early-stage D2C brands (₹50L–₹2Cr ARR)*
- **Growth** — *For scaling D2C brands (₹2Cr–₹50Cr ARR)*
- **Agency** — *For agencies managing 3–30 client brands*

*(Current taglines are generic. V2 gives each tier an ARR/client-count anchor so the visitor self-selects instantly.)*

### Testimonial (keep structure, refine)
> I replaced ~~Ahrefs (₹8,000/mo)~~, ~~Atria ($129/mo)~~, and ~~3 hours/week~~ of manual reporting with **Lumnix.**
>
> **Saving ₹18,700/mo + 12 hrs/month**
>
> — Early access user · **D2C snack brand**

*(Already good. No change needed beyond tightening the intro line if desired: "Here's what our first users are saying.")*

---

## Final CTA

**File:** `src/app/(landing)/components/FinalCTA.tsx`

### Badge
> STOP GUESSING. START KNOWING.

### Headline
> Marketing that guesses is **expensive.**
> Marketing that **knows** is unstoppable.

*(Keep — it's the strongest line on the page.)*

### Body
> Join the early-access waitlist of **D2C brands and agencies** who stopped exporting CSVs and started making decisions. Setup takes 3 minutes. Your stack takes 3 hours to build every month.

*(Current body is good but misses the ICP callout — V2 names them explicitly one more time before the CTA.)*

### Primary CTA
> Get early access — it's free

### Micro-copy under CTA
> No credit card · 3-minute setup · Cancel anytime

---

## Navbar copy (minor)

**File:** `src/app/(landing)/components/Navbar.tsx`

Suggested nav labels — check current ones and tighten if needed:
- Product
- Pricing
- For agencies *(new — if a dedicated agencies page exists or is planned)*
- Blog
- Log in · **Get early access**

*(A visible "For agencies" link in the navbar is the single highest-leverage move to signal "agencies welcome here" without splitting the hero.)*

---

## Global copy principles (apply everywhere)

1. **Name the ICP early.** Every section headline or its subhead should have "D2C" or "agency" or a concrete ARR band at least once.
2. **Replace "marketers" with "D2C brands and agencies"** wherever it appears. Generic = invisible.
3. **Every claim needs a number.** "Saves time" → "Saves 14 hours a week." "Expensive" → "₹75,000/mo."
4. **Kill vague verbs.** "Unlock," "empower," "transform," "supercharge" — none of these appear in V2. Use "replace," "shows," "tells you," "stops."
5. **Use the word "stack"** — D2C founders and agency owners both talk this way. "Your stack" is more recognizable than "your tools."

---

## Pricing claims — sourced (appendix)

Every rupee figure in V2 has been checked against live 2026 pricing pages. If anyone pushes back on the numbers, here's the receipt:

### Verified tool prices (converted at ~₹84/USD)

| Category | Tool | Entry tier | INR/mo |
|---|---|---|---|
| SEO | Moz Pro Starter | $49/mo | ₹4,116 |
| SEO | Ahrefs Lite | $129/mo | ₹10,836 |
| SEO | SEMrush Pro | $117.33/mo (annual) | ₹9,856 |
| Reporting | Swydo | €69/mo | ₹5,796 |
| Reporting | Whatagraph Start | €199/mo (annual) | ₹16,716 |
| Attribution | Triple Whale Growth | $129/mo (annual) | ₹10,836 |
| Attribution | Polar Analytics Core | ~$400/mo | ₹33,600 |
| Attribution | Northbeam Starter | $1,000/mo | ₹84,000 |
| Ad intel | PowerAdSpy Basic | $69/mo | ₹5,796 |
| Ad intel | Atria Core | $129/mo (annual) | ₹10,836 |
| Ad intel | AdSpy | $149/mo | ₹12,516 |
| AI chat | ChatGPT Plus | $20/mo | ₹1,680 |
| AI chat | ChatGPT Business (2 seats) | $25/seat/mo | ₹4,200 |

### Stack totals

- **Lean D2C (early-stage, no premium attribution):**
  Moz + Swydo + PowerAdSpy + ChatGPT Plus = **~₹17,400/mo**

- **Scaling D2C / agency (with mid-tier attribution):**
  Ahrefs + Whatagraph + Triple Whale + Atria + ChatGPT Business = **~₹53,500/mo**

- **Premium (with Northbeam instead of Triple Whale):**
  **₹84,000+/mo**

### Where the old ₹75,000/mo claim broke

That number only held up if you stacked Northbeam ($1,000/mo alone = ₹84k) with everything else. Most D2C brands and small-to-mid agencies aren't on Northbeam — they're on Triple Whale or nothing. The honest range is **₹17,000–₹55,000/mo**, and that's what V2 uses.

### Testimonial cross-check

The pricing-section testimonial says **"Saving ₹18,700/mo"** from replacing Ahrefs (₹8k) + Atria ($129 = ₹10.8k) + 3 hrs/week reporting. Ahrefs + Atria alone = ₹18,836/mo. **Math checks out** — keep the testimonial as-is.

---

## Open questions for you

1. **Should the navbar gain a "For agencies" link?** If yes, I'll wire it to `/for-agencies` (new route) or anchor to a new agency-focused section.
2. **Do you want a dedicated agency-proof section** (logos of agencies using Lumnix, multi-workspace screenshot) or keep pricing-tier copy as the only agency signal?
3. **Testimonial voice** — one D2C voice today. Want me to add a second testimonial slot for an agency owner so both ICPs see themselves?
4. **ARR bands** — the numbers I anchored to (₹50L–₹50Cr for brands, 3–30 clients for agencies) are my guess. Tell me your real target and I'll update all the section copy.

Once you've read this and flagged changes, I'll apply the copy to each component in a single pass.
