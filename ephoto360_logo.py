import sys
import json
from Ephoto360 import Ephoto360

style = sys.argv[1].strip() if len(sys.argv) > 1 else ""
text = " ".join(sys.argv[2:]).strip() if len(sys.argv) > 2 else ""

if not text:
    print(json.dumps({"ok": False, "error": "No logo text supplied"}))
    raise SystemExit

try:
    api = Ephoto360(
        retry_count=3,
        retry_delay=2,
        timeout=60
    )

    matches = api.search(style) if style else []
    result = None
    selected = None

    for effect in matches[:10]:
        try:
            generated = api.create(
                slug=effect.slug,
                texts=[text],
                random_style=True
            )

            if generated.ok and generated.url:
                result = generated
                selected = effect
                break
        except Exception:
            continue

    if result is None:
        effect = api.random_effect(require_radio=False)

        generated = api.create(
            slug=effect.slug,
            texts=[text],
            random_style=True
        )

        if generated.ok and generated.url:
            result = generated
            selected = effect

    if result:
        print(json.dumps({
            "ok": True,
            "url": result.url,
            "effect": selected.name if selected else style
        }))
    else:
        print(json.dumps({
            "ok": False,
            "error": "Ephoto360 returned no compatible effect"
        }))

except Exception as e:
    print(json.dumps({
        "ok": False,
        "error": str(e)
    }))
