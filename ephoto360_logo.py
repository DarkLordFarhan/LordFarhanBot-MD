import sys
import json
from Ephoto360 import Ephoto360

if len(sys.argv) < 2:
    print(json.dumps({"ok": False, "error": "Missing text"}))
    raise SystemExit

text = " ".join(sys.argv[1:]).strip()

try:
    api = Ephoto360(
        retry_count=3,
        retry_delay=2,
        timeout=60
    )

    # Search Ephoto360 using the requested text/style
    results = api.search(text)

    generated = None
    effect_name = None

    # Try matching effects
    for effect in results[:15]:
        try:
            r = api.create(
                slug=effect.slug,
                texts=[text],
                random_style=True
            )

            if r.ok and r.url:
                generated = r
                effect_name = effect.name
                break
        except Exception:
            continue

    # If no matching effect works, try random compatible effects
    if generated is None:
        for _ in range(5):
            try:
                effect = api.random_effect(require_radio=False)

                r = api.create(
                    slug=effect.slug,
                    texts=[text],
                    random_style=True
                )

                if r.ok and r.url:
                    generated = r
                    effect_name = effect.name
                    break
            except Exception:
                continue

    if generated is None:
        print(json.dumps({
            "ok": False,
            "error": "No compatible Ephoto360 effect found"
        }))
    else:
        print(json.dumps({
            "ok": True,
            "url": generated.url,
            "effect": effect_name or "Ephoto360"
        }))

except Exception as e:
    print(json.dumps({
        "ok": False,
        "error": str(e)
    }))
