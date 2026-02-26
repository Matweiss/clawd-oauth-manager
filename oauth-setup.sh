#!/bin/bash
# Simple OAuth setup helper
# Run: bash oauth-setup.sh

echo "🦞 Clawd OAuth Setup"
echo "===================="
echo ""
echo "This will authorize Google Calendar access."
echo ""

# OAuth URL
CLIENT_ID="391258212025-nafc7rponmj6i0ot2326j8ontcete0gn.apps.googleusercontent.com"
REDIRECT_URI="http://localhost:3000/oauth2callback"
SCOPES="https://www.googleapis.com/auth/calendar.readonly%20https://www.googleapis.com/auth/gmail.readonly"

AUTH_URL="https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPES}&access_type=offline&prompt=consent"

echo "Step 1: Click this link (or copy/paste to browser):"
echo ""
echo "$AUTH_URL"
echo ""
echo "Step 2: Log into Google and authorize Clawd"
echo ""
echo "Step 3: You'll be redirected to localhost (it will fail - that's OK!)"
echo ""
echo "Step 4: Copy the 'code' parameter from the URL"
echo "   Example: http://localhost:3000/oauth2callback?code=4/0A..."
echo "                                    ^^^^^^^^^^^^ copy this"
echo ""

read -p "Paste the code here: " AUTH_CODE

echo ""
echo "Exchanging code for tokens..."

# This will fail without client_secret, but shows the user what to do
echo ""
echo "⚠️  Now I need your Client Secret from Google Cloud Console"
echo ""
echo "To get it:"
echo "1. Go to: https://console.cloud.google.com/apis/credentials"
echo "2. Find 'Craftable AI Claw' or your OAuth client"
echo "3. Click the download icon (⬇️) next to your client"
echo "4. Open the JSON file and find 'client_secret'"
echo ""

read -p "Paste your Client Secret: " CLIENT_SECRET

echo ""
echo "Getting tokens..."

# Exchange code for tokens
RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "code=${AUTH_CODE}" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "grant_type=authorization_code")

echo "$RESPONSE" | tee tokens.json

echo ""
echo "✅ Tokens saved to tokens.json!"
echo ""
echo "Next steps:"
echo "1. Move tokens.json to: /root/.openclaw/workspace/clawd-oauth-manager/"
echo "2. Set environment variables (see README.md)"
echo "3. Test: node refresh.js"
