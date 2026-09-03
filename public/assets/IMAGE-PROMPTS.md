# Nistar — Image & Illustration Prompts

Use these prompts with an image generator (Midjourney, DALL-E, Stable Diffusion, etc.)
to create authentic, non-generic assets for the redesign.

---

## Photography

### Hero Background
**Prompt:**
> Warm cinematic photograph, diverse group of friends sitting together on a weathered wooden porch in golden hour, soft natural light, one person listening intently as another speaks, genuine unposed expressions, shallow depth of field, muted sage and cream tones, film photography aesthetic with subtle grain, no text, no watermarks, 1920x1080

**Alternative (if you prefer a single-subject hero):**
> Close-up candid photograph of two hands holding a well-worn journal on a sunlit windowsill, plant visible in background, warm beige and sage color grade, shallow depth of field, soft shadows, film aesthetic, 1920x1080

### Feature Section Background / Texture
**Prompt:**
> Abstract warm-toned photograph, sunlit textured fabric or woven blanket, close-up macro, muted sage and beige tones, soft shadows, subtle grain, no distinct objects, 1600x900

### Community Voices Background
**Prompt:**
> Soft-focus photograph of a cozy room corner with a comfortable armchair, a steaming mug on a side table, warm lamp light, muted sage green accent pillow, film photography, shallow depth of field, 1600x600

---

## Illustrations / Custom Graphics

### Hero Illustration (beside text, or as full background)
**Prompt:**
> Minimalist line art illustration, organic flowing shapes suggesting two figures in conversation, sage green line on warm cream background, hand-drawn aesthetic, plenty of negative space, subtle paper texture overlay, no fill, 1920x1080

### Feature Icons (set of 4)
**Prompt:**
> Set of 4 minimalist hand-drawn icons, sage green line art on transparent background, themes: open journal, supportive hands, growing plant, shield with heart, consistent stroke weight, organic slightly imperfect lines, no fill

### Background Pattern / Texture
**Prompt:**
> Subtle organic pattern, abstract flowing leaf and branch shapes, sage green on cream background, very low opacity, repeatable tile, paper texture overlay, no distinct focal point, 800x800

### Empty States / Illustrations
**Prompt:**
> Gentle hand-drawn illustration, abstract human silhouette looking toward a small glowing window, sage and beige tones, soft shadows, plenty of negative space, comforting not lonely, 400x400

---

## Style Guidelines for All Assets

**Color treatment:**
- Muted sage (#9CAF88) and warm beige (#F5F5DC, #E6D7C3) as primary tones
- Desaturated, film-like color grade
- Warm shadows, not cool/blue
- Avoid bright saturated greens or clinical whites

**Composition:**
- Generous negative space
- Soft, natural lighting
- Organic, slightly imperfect edges
- No sharp geometric dominance unless intentional

**What to avoid:**
- Yoga poses, meditation postures, hands on heart
- Stock model smiles, posed group shots
- Bright clinical whites, blue-purple tech gradients
- Text overlays, watermarks, logos
- 3D glossy effects, heavy shadows
- Emoji-style decoration

**File naming convention:**
```
public/assets/
├── hero-porch.jpg              # Hero background
├── hero-journal.jpg            # Alternative hero
├── texture-fabric.jpg          # Feature section background
├── texture-room.jpg            # Community voices background
├── illustration-conversation.svg  # Hero SVG illustration
├── icon-journal.svg            # Feature icons
├── icon-hands.svg
├── icon-plant.svg
├── icon-shield.svg
├── pattern-organic.svg         # Background pattern
├── empty-glow.svg              # Empty state illustration
```

---

## Recommended Asset Strategy

1. **Hero:** Use `hero-porch.jpg` as a full-bleed background with a warm dark overlay (`rgba(44, 44, 44, 0.55)`), so white/sage text reads clearly.
2. **Feature section:** Use `texture-fabric.jpg` at 15% opacity as a subtle background behind the feature cards.
3. **Community voices:** Use `texture-room.jpg` as a section background with sage-tinted overlay.
4. **Icons:** Use the SVG icon set instead of lucide-react for the four feature blocks — this alone removes a major "generic" signal.
5. **Empty states:** Use `empty-glow.svg` in empty feed/error states instead of emoji (😔, 🌱).
