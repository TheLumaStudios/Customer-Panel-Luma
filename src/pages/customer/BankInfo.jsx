import { useBankAccounts } from '@/hooks/useBankAccounts'
import { Button } from '@/components/ui/button'
import { Landmark, Copy } from 'lucide-react'
import { toast } from '@/lib/toast'

export default function BankInfo() {
  const { data: bankAccounts, isLoading } = useBankAccounts({ onlyActive: true })

  const handleCopyIban = async (iban) => {
    try {
      await navigator.clipboard.writeText(iban)
      toast.success('IBAN kopyalandı')
    } catch (_) {
      toast.error('Kopyalanamadı')
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Landmark className="h-7 w-7" /> Havale / EFT Bilgileri
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aşağıdaki banka hesaplarından birine ödeme yapabilirsiniz.
        </p>
      </div>

      {/* Warning banner */}
      <div className="rounded-lg bg-[#101a3d] text-white px-6 py-5 flex items-start gap-4">
        <div className="shrink-0 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold">
          !
        </div>
        <p className="text-sm leading-relaxed">
          Gönderen hesabındaki bilgiler ile müşteri hesabındaki bilgilerin
          eşleşmesi gereklidir. Ad soyad eşleşmez ise ödeme geri iade edilir.
          Havale/EFT işleminden sonra iletişim kanallarından mutlaka ödemeyi
          bildiriniz.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent" />
        </div>
      ) : !bankAccounts?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Landmark className="h-14 w-14 mx-auto mb-3 opacity-40" />
          <p>Henüz tanımlı banka hesabı bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bankAccounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-xl border bg-muted/30 p-6 flex flex-col items-center text-center"
            >
              <div className="h-28 w-full flex items-center justify-center mb-4">
                {acc.bank_logo_url ? (
                  <img
                    src={acc.bank_logo_url}
                    alt={acc.bank_name}
                    className="max-h-full max-w-[70%] object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <Landmark className="h-16 w-16 text-muted-foreground" />
                )}
              </div>

              <h3 className="text-xl font-bold mb-4">{acc.bank_name}</h3>

              <div className="w-full space-y-2 text-left">
                <div className="text-sm">
                  <span className="font-bold">Hesap Adı:</span>{' '}
                  <span className="text-foreground/80">{acc.account_holder}</span>
                </div>
                <div className="text-sm flex items-center gap-2">
                  <div className="flex-1">
                    <span className="font-bold">IBAN Numarası:</span>{' '}
                    <span className="font-mono text-foreground/80">{acc.iban}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleCopyIban(acc.iban)}
                    title="IBAN'ı kopyala"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {acc.branch && (
                  <div className="text-sm">
                    <span className="font-bold">Şube:</span>{' '}
                    <span className="text-foreground/80">{acc.branch}</span>
                  </div>
                )}
                {acc.swift && (
                  <div className="text-sm">
                    <span className="font-bold">SWIFT:</span>{' '}
                    <span className="font-mono text-foreground/80">{acc.swift}</span>
                  </div>
                )}
                {acc.currency && (
                  <div className="text-sm">
                    <span className="font-bold">Para Birimi:</span>{' '}
                    <span className="text-foreground/80">{acc.currency}</span>
                  </div>
                )}
                {acc.notes && (
                  <div className="text-xs text-muted-foreground pt-1">
                    {acc.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
