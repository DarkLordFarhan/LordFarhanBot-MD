import sys
import json
from Ephoto360 import Ephoto360

EFFECTS = {
    "neon": "/create-blue-neon-logo-online-507.html",
    "silver": "/create-glossy-silver-3d-text-effect-online-802.html",
    "blackpink": "/create-a-blackpink-style-logo-with-members-signatures-810.html",
    "naruto": "/naruto-shippuden-logo-style-text-effect-online-808.html",
    "glitch": "/create-digital-glitch-text-effects-online-767.html",
    "gaming": "/free-gaming-logo-maker-for-fps-game-team-546.html",
    "luxury": "/free-luxury-logo-maker-create-logo-online-458.html",
    "dragon": "/dragon-fire-text-effect-111.html",
    "angelwing": "/create-colorful-angel-wing-avatars-731.html",
    "gold": "/create-avatar-gold-online-303.html",
    "underwater": "/3d-underwater-text-effect-online-682.html",
    "firework": "/text-firework-effect-356.html",
    "zodiac": "/free-zodiac-online-logo-maker-491.html",
    "typography": "/make-typography-text-online-338.html",
    "team": "/make-team-logo-online-free-432.html"
}

# Curated fallback order.
# If one effect is temporarily unavailable, another known effect is tried.
FALLBACKS = [
    "neon",
    "silver",
    "glitch",
    "gaming",
    "luxury",
    "dragon",
    "gold",
    "underwater",
    "firework",
    "typography",
    "team",
    "blackpink",
    "naruto",
    "angelwing",
    "zodiac"
]

def output(ok=False, url=None, effect=None, error=None):
    print(json.dumps({
        "ok": ok,
        "url": url,
        "effect": effect,
        "error": error
    }))
    raise SystemExit

if len(sys.argv) < 3:
    output(False, error="Usage: ephoto360_logo.py <style> <text>")

style = sys.argv[1].strip().lower()
text = " ".join(sys.argv[2:]).strip()

if not text:
    output(False, error="Text is required")

try:
    client = Ephoto360(
        retry_count=3,
        retry_delay=2,
        timeout=60
    )

    # Random working logo
    if style == "random":
        styles = FALLBACKS[:]
    else:
        styles = [style] + [x for x in FALLBACKS if x != style]

    for current in styles:
        slug = EFFECTS.get(current)

        if not slug:
            continue

        try:
            result = client.create(
                slug=slug,
                texts=[text],
                random_style=True
            )

            if result.ok and result.url:
                output(
                    True,
                    result.url,
                    current
                )

        except Exception as e:
            print(
                f"Ephoto effect {current} failed: {e}",
                file=sys.stderr
            )
            continue

    output(
        False,
        error="No working Ephoto360 effect was available right now"
    )

except Exception as e:
    output(False, error=str(e))
