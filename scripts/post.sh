#!/bin/bash
# Postiz poster v2 — usage: ./post.sh -p "text" -i integration_id [-m "media_url"] [-t platform_type]
# Uses the correct nested posts[] API format

API_KEY="1ce769b523faba36e01cee506330b73098b69e665d1027f629e7245d3e215362"
BASE_URL="https://api.postiz.com/public/v1"

TEXT=""
INTEGRATION=""
MEDIA=""
SETTINGS_TYPE="x"

while [[ $# -gt 0 ]]; do
  case $1 in
    -p) TEXT="$2"; shift 2 ;;
    -i) INTEGRATION="$2"; shift 2 ;;
    -m) MEDIA="$2"; shift 2 ;;
    -t) SETTINGS_TYPE="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [ -z "$TEXT" ] || [ -z "$INTEGRATION" ]; then
  echo "Usage: ./post.sh -p 'text' -i integration_id [-m 'media_url'] [-t 'x|tiktok|instagram-standalone']"
  exit 1
fi

# Build settings based on platform
SETTINGS="{\"__type\": \"$SETTINGS_TYPE\""
if [ "$SETTINGS_TYPE" = "x" ]; then
  SETTINGS="$SETTINGS, \"who_can_reply_post\": \"everyone\""
elif [ "$SETTINGS_TYPE" = "instagram-standalone" ]; then
  SETTINGS="$SETTINGS, \"post_type\": \"feed\""
elif [ "$SETTINGS_TYPE" = "tiktok" ]; then
  SETTINGS="$SETTINGS, \"privacy_level\": \"PUBLIC_TO_EVERYONE\", \"duet\": false, \"stitch\": false, \"comment\": true, \"autoAddMusic\": false, \"brand_content_toggle\": false, \"brand_organic_toggle\": false, \"content_posting_method\": \"DIRECT_POST\""
fi
SETTINGS="$SETTINGS}"

DATE=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Build image array
IMAGE_ARRAY="[]"
if [ -n "$MEDIA" ]; then
  IMAGE_ARRAY=$(python3 -c "
import json, sys
urls = '$MEDIA'.split(',')
imgs = [{'id': f'img{i}', 'path': u.strip()} for i, u in enumerate(urls) if u.strip()]
print(json.dumps(imgs))
")
fi

# Build JSON with python for safety
JSON=$(python3 -c "
import json
data = {
    'type': 'now',
    'date': '$DATE',
    'shortLink': False,
    'tags': [],
    'posts': [{
        'integration': {'id': '$INTEGRATION'},
        'value': [{'content': '''$(echo "$TEXT" | sed "s/'/'\\\\''/g")''', 'image': $IMAGE_ARRAY}],
        'settings': $SETTINGS
    }]
}
print(json.dumps(data))
")

RESPONSE=$(curl -s -X POST "$BASE_URL/posts" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON")

echo "$RESPONSE"
