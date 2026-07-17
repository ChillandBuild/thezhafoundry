#!/usr/bin/env bash
# brand/linkedin/render.sh — regenerates every LinkedIn PNG from its HTML source.
set -euo pipefail
cd "$(dirname "$0")"

# profile pictures render from SVG sources — the SVGs are the deliverable
# for print/design use; PNGs are the LinkedIn upload format (800px = 2x
# LinkedIn's recommended 400px, for retina sharpness after downscale)
npx playwright screenshot --viewport-size=800,800   profile-picture-dark.svg   profile-picture-dark.png
npx playwright screenshot --viewport-size=800,800   profile-picture-light.svg  profile-picture-light.png
npx playwright screenshot --viewport-size=800,800   profile-picture-heat.svg   profile-picture-heat.png
npx playwright screenshot --viewport-size=4200,700  cover-banner-dark.html     cover-banner-dark.png
npx playwright screenshot --viewport-size=4200,700  cover-banner-light.html    cover-banner-light.png
npx playwright screenshot --viewport-size=1080,1080 launch-post-dark.html     launch-post-dark.png
npx playwright screenshot --viewport-size=1080,1080 launch-post-light.html    launch-post-light.png

echo "Rendered 7 PNGs into brand/linkedin/"
