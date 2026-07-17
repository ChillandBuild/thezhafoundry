#!/usr/bin/env bash
# brand/linkedin/render.sh — regenerates every LinkedIn PNG from its HTML source.
set -euo pipefail
cd "$(dirname "$0")"

npx playwright screenshot --viewport-size=400,400   profile-picture-dark.html  profile-picture-dark.png
npx playwright screenshot --viewport-size=400,400   profile-picture-light.html profile-picture-light.png
npx playwright screenshot --viewport-size=4200,700  cover-banner-dark.html     cover-banner-dark.png
npx playwright screenshot --viewport-size=4200,700  cover-banner-light.html    cover-banner-light.png
npx playwright screenshot --viewport-size=1080,1080 launch-post-dark.html     launch-post-dark.png
npx playwright screenshot --viewport-size=1080,1080 launch-post-light.html    launch-post-light.png

echo "Rendered 6 PNGs into brand/linkedin/"
