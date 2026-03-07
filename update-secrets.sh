#!/bin/bash

PROJECT_ID="pbgajlkaulxrspyptzzs"

echo "🔑 DomainNameAPI Credentials Update"
echo "===================================="
echo ""
echo "Kullanıcı Adı: enesp"
echo ""
echo -n "DomainNameAPI şifrenizi girin: "
read -s DNA_PASSWORD
echo ""
echo ""

echo "📤 Secrets güncelleniyor..."
supabase secrets set DNA_PASSWORD="$DNA_PASSWORD" --project-ref $PROJECT_ID

if [ $? -eq 0 ]; then
    echo "✅ Şifre başarıyla güncellendi!"
    echo ""
    echo "🧪 Test için şu komutu çalıştırın:"
    echo "   bash test-domain-api.sh"
else
    echo "❌ Şifre güncellenemedi."
fi
