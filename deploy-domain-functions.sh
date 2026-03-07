#!/bin/bash

# Domain Reseller Functions Deployment Script
# ===========================================

PROJECT_ID="pbgajlkaulxrspyptzzs"

echo "🚀 Domain Reseller Functions Deployment Başlatılıyor..."
echo ""

# Step 1: Check if logged in
echo "📋 Step 1/4: Supabase login kontrolü..."
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Supabase'e login olmadınız. Login sayfası açılıyor..."
    supabase login
    if [ $? -ne 0 ]; then
        echo "❌ Login başarısız. Lütfen tekrar deneyin."
        exit 1
    fi
fi
echo "✅ Login başarılı!"
echo ""

# Step 2: Deploy functions
echo "📦 Step 2/4: Edge Functions deploy ediliyor..."
echo "   - domain-check"
echo "   - domain-pricing"
echo "   - domain-register"
echo ""

supabase functions deploy domain-check domain-pricing domain-register --project-ref $PROJECT_ID

if [ $? -eq 0 ]; then
    echo "✅ Functions başarıyla deploy edildi!"
else
    echo "❌ Deployment başarısız. Lütfen hata mesajını kontrol edin."
    exit 1
fi
echo ""

# Step 3: Set secrets
echo "🔑 Step 3/4: API Credentials ayarlanıyor..."
echo ""
echo "DomainNameAPI kullanıcı adınız: enesp"
echo -n "DomainNameAPI şifrenizi girin: "
read -s DNA_PASSWORD
echo ""

supabase secrets set DNA_USERNAME=enesp --project-ref $PROJECT_ID
supabase secrets set DNA_PASSWORD=$DNA_PASSWORD --project-ref $PROJECT_ID

if [ $? -eq 0 ]; then
    echo "✅ Secrets başarıyla ayarlandı!"
else
    echo "❌ Secrets ayarlama başarısız."
    exit 1
fi
echo ""

# Step 4: Verify deployment
echo "🧪 Step 4/4: Deployment doğrulanıyor..."
echo ""

supabase functions list --project-ref $PROJECT_ID

echo ""
echo "✅ Deployment tamamlandı! 🎉"
echo ""
echo "📊 Logs izlemek için:"
echo "   supabase functions logs --project-ref $PROJECT_ID"
echo ""
echo "🧪 Test etmek için domain-search sayfasına gidin:"
echo "   http://localhost:5173/domain-search (dev)"
echo "   https://your-domain.com/domain-search (production)"
echo ""
echo "⚠️  NOT: DomainNameAPI depozito bakiyenizin olduğundan emin olun!"
echo ""
