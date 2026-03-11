import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approveContract } from '@/lib/api/contracts'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileText, Shield, AlertCircle, Check, X, Info } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from '@/lib/toast'

export default function ContractApprovalModal({ contract, open, onOpenChange }) {
  const queryClient = useQueryClient()
  const [agreed, setAgreed] = useState(false)
  const [deviceFingerprint, setDeviceFingerprint] = useState('')

  useEffect(() => {
    // Basit bir cihaz parmak izi oluştur
    const fingerprint = `${navigator.userAgent}_${screen.width}x${screen.height}_${new Date().getTimezoneOffset()}`
    setDeviceFingerprint(btoa(fingerprint).substring(0, 32))
  }, [])

  const approveMutation = useMutation({
    mutationFn: approveContract,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['pending-contracts'])
      queryClient.invalidateQueries(['customer-contracts'])
      onOpenChange(false)
      setAgreed(false)

      toast.success('Sözleşme onaylandı', {
        description: 'Onayınız kaydedildi ve işleme alındı',
      })

      // Non-repudiation bilgisini göster
      console.log('📝 Non-repudiation info:', data.non_repudiation_info)
    },
    onError: (error) => {
      toast.error('Onaylama hatası', {
        description: error.message,
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (contractId) => approveContract({
      customer_contract_id: contractId,
      approval_status: 'rejected',
      approval_text: contract?.contract_content,
      device_fingerprint: deviceFingerprint,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-contracts'])
      queryClient.invalidateQueries(['customer-contracts'])
      onOpenChange(false)
      setAgreed(false)

      toast.success('Sözleşme reddedildi')
    },
    onError: (error) => {
      toast.error('Hata', {
        description: error.message,
      })
    },
  })

  const handleApprove = () => {
    if (!agreed) {
      toast.error('Lütfen sözleşmeyi onaylayın')
      return
    }

    approveMutation.mutate({
      customer_contract_id: contract.id,
      approval_status: 'approved',
      approval_text: contract.contract_content,
      device_fingerprint: deviceFingerprint,
    })
  }

  const handleReject = () => {
    if (contract.is_mandatory) {
      toast.error('Bu sözleşme zorunludur', {
        description: 'Hizmetlerimizi kullanabilmek için onaylamanız gerekmektedir',
      })
      return
    }

    rejectMutation.mutate(contract.id)
  }

  if (!contract) return null

  const daysLeft = contract.expires_at
    ? Math.ceil((new Date(contract.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{contract.template?.name}</DialogTitle>
              <DialogDescription>
                {contract.template?.description}
              </DialogDescription>
            </div>
            {contract.is_mandatory && (
              <Badge variant="destructive">Zorunlu</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Info Section */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Versiyon</div>
                <div className="text-sm text-muted-foreground">{contract.version}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Gönderim Tarihi</div>
                <div className="text-sm text-muted-foreground">{formatDate(contract.sent_at)}</div>
              </div>
            </div>
            {daysLeft !== null && (
              <div className="flex items-start gap-2 col-span-2">
                <AlertCircle className={`h-4 w-4 mt-0.5 ${daysLeft < 7 ? 'text-red-500' : 'text-muted-foreground'}`} />
                <div>
                  <div className="text-sm font-medium">Son Onay Tarihi</div>
                  <div className={`text-sm ${daysLeft < 7 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                    {formatDate(contract.expires_at)} ({daysLeft} gün kaldı)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contract Content */}
          <div className="flex-1 overflow-hidden border rounded-lg">
            <div className="h-[400px] overflow-y-auto p-6">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: contract.contract_content }}
              />
            </div>
          </div>

          <Separator />

          {/* Non-Repudiation Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-1">
              <div className="font-medium text-blue-900">İnkar Edilemezlik (Non-Repudiation)</div>
              <div className="text-blue-700">
                Bu sözleşmeyi onayladığınızda, IP adresiniz, cihaz bilgileriniz ve onay zamanınız
                <strong> 5070 sayılı Elektronik İmza Kanunu</strong> kapsamında kaydedilecektir.
                Bu kayıt, onayınızı sonradan inkar edememenizi sağlar ve hukuki geçerliliğe sahiptir.
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start space-x-3 p-4 border-2 border-dashed rounded-lg">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={setAgreed}
              className="mt-1"
            />
            <label
              htmlFor="agree"
              className="text-sm leading-relaxed cursor-pointer flex-1"
            >
              Yukarıdaki sözleşmeyi okudum, anladım ve kabul ediyorum. Onay verdiğim anda
              kimlik bilgilerimin kaydedileceğini ve bu onayı sonradan inkar edemeyeceğimi
              biliyorum ve kabul ediyorum.
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {!contract.is_mandatory && (
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Reddet
            </Button>
          )}
          <Button
            onClick={handleApprove}
            disabled={!agreed || approveMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            {approveMutation.isPending ? 'Onaylanıyor...' : 'Onaylıyorum'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
