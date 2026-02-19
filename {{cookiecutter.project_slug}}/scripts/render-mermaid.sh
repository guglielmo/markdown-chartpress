#!/bin/bash
#
# render-mermaid.sh
#
# Converts .mmd files to SVG images using mermaid-cli (mmdc)
#
# Usage: bash scripts/render-mermaid.sh

set -e

MERMAID_DIR=".build/mermaid-diagrams"
OUTPUT_DIR="docs/public/images"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Check if mermaid-cli is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

echo "🎨 Rendering Mermaid diagrams to SVG..."

# Count total diagrams
TOTAL=$(find "$MERMAID_DIR" -name "*.mmd" 2>/dev/null | wc -l)

if [ "$TOTAL" -eq 0 ]; then
    echo "⚠️  No .mmd files found in $MERMAID_DIR"
    echo "   Run 'node scripts/extract-mermaid.js' first"
    exit 1
fi

echo "   Found $TOTAL diagram(s) to render"

# Render each .mmd file
COUNT=0
for mmd_file in "$MERMAID_DIR"/*.mmd; do
    if [ -f "$mmd_file" ]; then
        BASENAME=$(basename "$mmd_file" .mmd)
        SVG_FILE="$OUTPUT_DIR/${BASENAME}.svg"
        PNG_FILE="$OUTPUT_DIR/${BASENAME}.png"

        echo "   [$((++COUNT))/$TOTAL] Rendering $BASENAME..."

        # Render both SVG (for website) and PNG (for PDF - better compatibility)
        npx -y mmdc -i "$mmd_file" -o "$SVG_FILE" -t neutral -b transparent -p .puppeteerrc.json || {
            echo "      ⚠️  Failed to render SVG for $BASENAME (skipping)"
            continue
        }

        npx -y mmdc -i "$mmd_file" -o "$PNG_FILE" -t neutral -b white -p .puppeteerrc.json -w 1200 || {
            echo "      ⚠️  Failed to render PNG for $BASENAME (skipping)"
            continue
        }

        echo "      ✅ Saved SVG and PNG to $OUTPUT_DIR/"
    fi
done

echo ""
echo "✅ Rendered $COUNT/$TOTAL Mermaid diagrams"
echo "   Output directory: $OUTPUT_DIR"
