#!/bin/bash
# Backfill articles with Unsplash image URLs based on tags
# Uses source.unsplash.com which redirects to actual images (no API key needed)

BLOG_DIR="$(cd "$(dirname "$0")/../content/blog" && pwd)"
COUNT=0
SKIPPED=0

for file in "$BLOG_DIR"/*.md; do
  # Check if image field already exists and is not the default
  existing=$(grep -m1 '^image:' "$file" 2>/dev/null || true)
  if [ -n "$existing" ] && ! echo "$existing" | grep -q 'og-image.png'; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Extract tags
  tags=$(sed -n '/^tags:/,/^[a-z]/p' "$file" | grep '^\s*-\s*"' | sed 's/.*"\(.*\)".*/\1/' | head -3 | tr '\n' ',' | sed 's/,$//')
  
  if [ -z "$tags" ]; then
    # Fall back: extract from tags array format ["tag1", "tag2"]
    tags=$(grep -m1 '^tags:' "$file" | sed 's/tags:\s*\[//;s/\]//;s/"//g;s/,\s*/,/g' | cut -d, -f1-3)
  fi

  if [ -z "$tags" ]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Clean tags for URL (replace spaces with +)
  keywords=$(echo "$tags" | sed 's/ /+/g')
  url="https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=1200&h=630&fit=crop&q=80"
  
  # Use a deterministic Unsplash source URL based on keywords
  url="https://source.unsplash.com/1200x630/?${keywords}"

  # Add or replace image field in frontmatter
  if grep -q '^image:' "$file"; then
    sed -i '' "s|^image:.*|image: \"${url}\"|" "$file"
  else
    # Add after the date line
    sed -i '' "/^date:/a\\
image: \"${url}\"
" "$file"
  fi

  COUNT=$((COUNT + 1))
done

echo "Backfilled: $COUNT articles"
echo "Skipped: $SKIPPED articles (already had images)"
