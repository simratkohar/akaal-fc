---
name: Haute Performance Athlétique
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d1c5b2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9a8f7e'
  outline-variant: '#4e4637'
  surface-tint: '#ebc165'
  primary: '#ebc165'
  on-primary: '#3f2e00'
  primary-container: '#c9a24a'
  on-primary-container: '#4f3900'
  inverse-primary: '#795900'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#ffb3af'
  on-tertiary: '#68000e'
  tertiary-container: '#ff827e'
  on-tertiary-container: '#7f0013'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdf9e'
  primary-fixed-dim: '#ebc165'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5b4300'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#930018'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Bebas Neue
    fontSize: 44px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: 0.04em
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: 0.03em
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0.03em
  headline-sm:
    fontFamily: Bebas Neue
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.05em
  score-xl:
    fontFamily: Bebas Neue
    fontSize: 56px
    fontWeight: '400'
    lineHeight: 52px
    letterSpacing: 0.02em
  squad-number:
    fontFamily: Bebas Neue
    fontSize: 38px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-md:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Manrope
    fontSize: 9px
    fontWeight: '800'
    lineHeight: 12px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system establishes a high-fashion, athletic aesthetic for an elite Parisian football institution. Merging the tactical edge of contemporary European football culture (PSG, Juventus) with couture sensibilities, the design language exudes discipline, prestige, and relentless competitive drive.

### Brand Values & Persona
- **Prestige & Noblesse:** Uncompromising luxury rooted in deep pitch tones, radiant metallic golds, and sculpted contrast.
- **Athletic Dynamism:** Kinetic visual tension inspired by the home kit’s diagonal sash and high-contrast zebra-geometry.
- **Fraternité & Rigueur:** Parisian identity delivered through nuanced French Tricolore micro-accents and strict typographic hierarchies.

### Design Movement
The interface operates within **Neo-Athletic Luxury**: a fusion of high-contrast minimalism, dark tactile surfaces, sharp structural alignment, and sports broadcast data density. It rejects toy-like gradients in favor of matte textures, hairline metallic trims, and bold condensed typography reminiscent of match-worn jersey numbers.

## Colors

The palette is engineered for pure OLED blacks, crisp optical legibility under direct floodlights, and surgical athletic accents.

### Palette Architecture
- **Pitch Dark Canvas:**
  - `#080808` (`pitch-black`): Baseline backdrop and primary screen grounding.
  - `#0E0E10` (`pitch-subtle`): Section containers, navigation chrome, and bottom sheets.
  - `#141416` (`card-surface`): Default card background, list item plates.
  - `#1E1E22` (`card-elevated`): Active/focused containers, floating cards, modals.
- **Metallic Gold Accents:**
  - `#C9A24A` (`gold-primary`): Primary brand highlight, captaincy emblems, trophies, key CTA active outlines.
  - `#E6C66A` (`gold-radiant`): Scoreboard callouts, glowing highlights, hero typography trim.
  - `#8B7332` (`gold-muted`): Hairline divider borders, subtle card outlines, inactive tab indicators.
- **Monochrome Foundation:**
  - `#FFFFFF` (`pure-white`): Jersey numbers, primary headline text, crisp contrast diagonal graphics.
  - `#F5F1E6` (`off-white-warm`): Subtitles, contextual body copy, soft tactile labels.
  - `#8E8E93` (`text-secondary`): Timestamps, inactive metadata, field labels.
- **Tricolore Heritage Lines:**
  - `#002654` (`tricolore-bleu`), `#FFFFFF` (`tricolore-blanc`), `#ED2939` (`tricolore-rouge`): Reserved exclusively for horizontal ribbon micro-dividers and crest borders (1.5px stroke weight).
- **Matchday Functional Statuses:**
  - `#10B981` (`presence-present`): Match availability confirmed.
  - `#EF4444` (`presence-absent`): Player declared absent.
  - `#F59E0B` (`presence-pending`): Awaiting response / En attente.

## Typography

The typography leverages an athletic contrast between kit-inspired condensed headlines and crisp, architectural sans-serif for interface legibility.

### Headline & Scoreboard Architecture (`Bebas Neue`)
All match titles, squad numbers, match minute timers, countdown metrics, and standings headers employ `Bebas Neue`. It reflects kit printing and stadium LED boards:
- Always styled in uppercase for headlines and labels.
- Jersey squad numbers and primary scorelines utilize a subtle 1px stroke rim (`#C9A24A`) over `#FFFFFF` fills on dark surfaces.

### UI, Content & System Architecture (`Manrope`)
Player profiles, tactical notes, match reports, navigation labels, and badges rely on `Manrope`. Its geometric neutrality maintains readability on small mobile viewports (iOS 390pt baseline). 
- All labels in tags, category markers, and status chips use `fontWeight: 700` or `800` with expanded letter-spacing (`0.06em` to `0.1em`) and uppercase transformation (e.g., `GARDIEN`, `DÉFENSEUR`, `MILIEU`, `ATTAQUANT`).

## Layout & Spacing

Designed specifically for the mobile sports cockpit (390px base width, scaling seamlessly to 428px+):

### Spacing Grid & Margins
- **Base Canvas:** Screen margin is fixed at `16px` (`margin`), maximizing screen real estate for tactical cards, lineups, and match center timelines.
- **Rhythm:** An 8-point base spatial system (`space-xs`: 4px, `space-sm`: 8px, `space-md`: 12px, `space-lg`: 16px, `space-xl`: 24px).
- **Match Grid Columns:** Dynamic 2-column or 3-column splits inside cards use an internal gutter of `12px` (`gutter`).

### Jersey Diagonal Stripe Motif
Cards and hero sections incorporate a distinct 45-degree diagonal high-contrast band texture. The stripe pattern uses alternating bands:
- `#141416` base with 8% opacity `#FFFFFF` angled bands (width: `24px`, spacing: `24px`).
- In celebration or Matchday Hero moments, the stripes increase in contrast with a subtle metallic gold specular sheen across the diagonal axis.

## Elevation & Depth

This system avoids heavy, blurred drop shadows. Depth is achieved through pitch-layer stratification, hairline metallic borders, and precision light-catching edges.

### Layered Surfaces
1. **Floor (Niveau 0 - `#080808`):** Deep infinite pitch dark canvas.
2. **Surface (Niveau 1 - `#141416`):** Static cards, calendar modules, lineup list cells. Outlined with a hairline border (`1px solid rgba(201, 162, 74, 0.15)` or `1px solid rgba(255, 255, 255, 0.08)`).
3. **Elevated (Niveau 2 - `#1E1E22`):** Interactive cards, expanded statistics, floating CTA action bars. Bordered by `1px solid rgba(201, 162, 74, 0.35)`.
4. **Overlay / Drawer (Niveau 3 - `#24242A`):** Modals, position replacement sheets, presence action pickers. Accompanied by a top gold hairline gradient line (`to right, #002654, #FFFFFF, #ED2939, #C9A24A`).

### Glows & Backdrops
- Active countdown badges and live match indicators use a subtle ambient gold ray: `box-shadow: 0 0 16px rgba(201, 162, 74, 0.20)`.
- Sticky top navigation bars use `backdrop-filter: blur(20px)` with background `rgba(8, 8, 8, 0.85)` and a bottom border of `1px solid rgba(201, 162, 74, 0.12)`.

## Shapes

The design uses a clean, architectural, and compact corner radius (`roundedness: 1` — Soft, 4px baseline, 8px on cards, 12px on modal sheets).

### Geometry Principles
- **Cards & Match Banners:** Corner radius of `8px` (`rounded-lg`). Retains the sharp, athletic precision of pitch perimeters and team sheets.
- **Buttons & Toggles:** Corner radius of `6px` to `8px`. Avoids playful circular bubbles to sustain athletic grit and technical structure.
- **Armband & Position Tags:** Sharp, micro-radius badges (`4px`), accented with diagonal chamfers where applicable.
- **Jersey Numbers & Crests:** Retain circular badges strictly for official round club crests (`36px` to `64px`) and captaincy 'C' discs (`24px`).

## Components

### 1. Match Countdown Hero Card (*Carte Compte à Rebours*)
- **Background:** `#141416` layered with a dynamic 45° black/white diagonal jersey watermark pattern at 6% opacity.
- **Header:** Competition title (`CHAMPIONNAT R1`, `label-md`) in `#C9A24A` with a micro French Tricolore strip (`3px` height) centered beneath it.
- **Centerpiece:** Team crests flanking the bold condensed fixture time (`Bebas Neue`, `score-xl`). 
- **Countdown Matrix:** Segmented timer boxes (JOURS, HEURES, MIN) in elevated card plates (`#1E1E22`), labeled with uppercase `label-sm`.

### 2. Presence Action Toggle (*Sélecteur de Présence*)
- **Container:** Segmented horizontal selector spanning full card width on `#0E0E10` base.
- **States:**
  - **Présent:** Fill `#10B981` (12% alpha in inactive, 100% solid on active with `#FFFFFF` text), border `1px solid #10B981`.
  - **Absent:** Fill `#EF4444` (12% alpha in inactive, 100% solid on active with `#FFFFFF` text), border `1px solid #EF4444`.
  - **Sans réponse:** Fill `#1E1E22`, text `#8E8E93`, border `1px dashed rgba(255, 255, 255, 0.2)`.
- **Feedback:** Tactile bounce on tap, instant count increment in team roster tab.

### 3. Squad & Position Badges (*Badges d'Effectif*)
- **Position Tags:** Structured pill-capsules (`4px` radius) with high-contrast colored micro-dots:
  - `GARDIEN` (GKP): Border `#E6C66A`, text `#E6C66A`, background `rgba(230, 198, 106, 0.1)`.
  - `DÉFENSEUR` (DEF): Border `#3B82F6`, text `#93C5FD`, background `rgba(59, 130, 246, 0.1)`.
  - `MILIEU` (MID): Border `#10B981`, text `#6EE7B7`, background `rgba(16, 185, 129, 0.1)`.
  - `ATTAQUANT` (ATT): Border `#ED2939`, text `#FCA5A5`, background `rgba(237, 41, 57, 0.1)`.
- **Captain Armband Badge ('C'):** Gold badge (`#C9A24A`) with solid black condensed 'C' emblem, placed adjacent to player names.

### 4. Player Cards & Jersey Numbers
- **Player Plate:** Horizontal card layout (`#141416`) with player photo thumbnail, name in `headline-sm`, and jersey number rendered in `squad-number` typography (`Bebas Neue`) in `#FFFFFF` with a `1px` outer stroke of `#C9A24A`.

### 5. Standings & Buteurs Progress Bars (*Barres de Progression*)
- **Track:** Base container `#1E1E22`, height `6px`, radius `3px`.
- **Fill:** Gradient from `#8B7332` to `#E6C66A` for goal leader tallies.
- **Match Stats:** Split progress bars for possession and shots on target using club white (`#FFFFFF`) against opponent muted grey (`#3A3A3C`).

### 6. Buttons & CTAs
- **Primary CTA:** Solid metallic gold background `#C9A24A`, text `#080808` in `Manrope` bold (`14px`), uppercase with `0.06em` letter spacing. Active pressed state: `#E6C66A`.
- **Secondary CTA:** Pitch card surface `#141416`, border `1px solid #C9A24A`, text `#FFFFFF`.
- **Tricolore Accent Divider:** Used sparingly above primary match actions—a 1.5px continuous hairline line divided into equal sections of Bleu `#002654`, Blanc `#FFFFFF`, and Rouge `#ED2939`.