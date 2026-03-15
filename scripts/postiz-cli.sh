#!/bin/bash

# Simple Postiz CLI script for posting to X
POSTIZ_API_KEY="1ce769b523faba36e01cee506330b73098b69e665d1027f629e7245d3e215362"
POSTIZ_BASE_URL="https://api.postiz.com/public/v1"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--post)
      POST_TEXT="$2"
      shift 2
      ;;
    -i|--integration)
      INTEGRATION_ID="$2"
      shift 2
      ;;
    -m|--media)
      MEDIA_URLS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

if [ -z "$POST_TEXT" ] || [ -z "$INTEGRATION_ID" ]; then
  echo "Both --post and --integration are required"
  exit 1
fi

# Build JSON payload
if [ -n "$MEDIA_URLS" ]; then
  # Convert comma-separated URLs to JSON array
  MEDIA_JSON=$(echo "$MEDIA_URLS" | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')
  JSON_PAYLOAD=$(cat <<EOF
{
  "content": "$POST_TEXT",
  "settings": {
    "__type": "x"
  },
  "integrations": ["$INTEGRATION_ID"],
  "shortLink": false,
  "tags": [],
  "media": [$MEDIA_JSON]
}
EOF
)
else
  JSON_PAYLOAD=$(cat <<EOF
{
  "content": "$POST_TEXT",
  "settings": {
    "__type": "x"
  },
  "integrations": ["$INTEGRATION_ID"],
  "shortLink": false,
  "tags": []
}
EOF
)
fi

# Post to Postiz
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Authorization: $POSTIZ_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  "$POSTIZ_BASE_URL/posts")

# Extract response body and status
http_body=$(echo "$response" | sed -E 's/HTTP_STATUS:[0-9]{3}$//')
http_status=$(echo "$response" | tail -n1 | sed -E 's/.*HTTP_STATUS:([0-9]{3})$/\1/')

if [ "$http_status" -ne 200 ] && [ "$http_status" -ne 201 ]; then
  echo "Failed to post: HTTP $http_status"
  echo "$http_body"
  exit 1
fi

echo "Posted successfully:"
echo "$http_body"