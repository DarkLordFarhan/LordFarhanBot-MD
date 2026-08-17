import sys
import json
from Ephoto360 import Ephoto360

query = " ".join(sys.argv[1:]).strip()

if not query:
    print(json.dumps({
        "ok": False,
        "error": "No text supplied"
    }))
    sys.exit(0)

try:
    client = Ephoto360(
        retry_count=3,
        retry_delay=2,
        timeout=60
    )

    # Try to interpret the complete query as a style/search request.
    # If a matching effect exists, use it.
    matches = client.search(query)

    if matches:
        effect = matches[0]

        result = client.create(
            slug=effect.slug,
            texts=[query],
            random_style=True
        )

        if result.ok:
            print(json.dumps({
                "ok": True,
                "url": result.url,
                "effect": effect.name
            }))
            sys.exit(0)

    # Fallback: use a random Ephoto360 effect.
    effect = client.random_effect(require_radio=False)

    result = client.create(
        slug=effect.slug,
        texts=[query],
        random_style=True
    )

    if result.ok:
        print(json.dumps({
            "ok": True,
            "url": result.url,
            "effect": effect.name
        }))
    else:
        print(json.dumps({
            "ok": False,
            "error": result.error or "Ephoto360 generation failed"
        }))

except Exception as e:
    print(json.dumps({
        "ok": False,
        "error": str(e)
    }))
