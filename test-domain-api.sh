#!/bin/bash

echo "🧪 Testing Domain API (Production)"
echo "===================================="
echo ""

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZ2FqbGthdWx4cnNweXB0enpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzIzNDYsImV4cCI6MjA4ODE0ODM0Nn0.3gOjcLj6G_jhdE_Jf4zZJEPwxmD0p4fGeoO-w-imDtA"

echo "📡 Sending request to production..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  'https://pbgajlkaulxrspyptzzs.supabase.co/functions/v1/domain-check' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"domains":["google","example"],"extensions":["com","net"],"period":1}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "📊 Response Status: $HTTP_STATUS"
echo "📦 Response Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Request successful!"
else
    echo "❌ Request failed with status $HTTP_STATUS"
fi

echo ""
echo "🔍 Check logs at:"
echo "https://supabase.com/dashboard/project/pbgajlkaulxrspyptzzs/logs/edge-functions"
