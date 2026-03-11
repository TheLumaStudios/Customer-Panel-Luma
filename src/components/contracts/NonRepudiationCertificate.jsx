import { Shield, FileText, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function NonRepudiationCertificate({ approval }) {
  if (!approval) return null

  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  }

  const getCurrentDate = () => {
    return new Date().toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="certificate-container p-4 bg-white text-xs">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .certificate-container,
          .certificate-container * {
            visibility: visible !important;
          }

          .certificate-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 0.5cm !important;
            margin: 0 !important;
            background: white !important;
            z-index: 99999 !important;
            font-size: 9pt !important;
          }

          @page {
            size: A4 portrait;
            margin: 1cm;
          }

          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }

          /* Compact spacing for print */
          .certificate-container h1 {
            font-size: 16pt !important;
            margin-bottom: 2px !important;
          }

          .certificate-container h2 {
            font-size: 18pt !important;
            margin-bottom: 4px !important;
          }

          .certificate-container h3 {
            font-size: 11pt !important;
            margin-bottom: 4px !important;
          }

          .certificate-container p {
            font-size: 8pt !important;
            margin-bottom: 2px !important;
          }

          .certificate-container table td {
            padding: 2px 4px !important;
            font-size: 8pt !important;
          }

          .certificate-container .mb-6 {
            margin-bottom: 8px !important;
          }

          .certificate-container .mb-8 {
            margin-bottom: 10px !important;
          }

          .certificate-container .p-4 {
            padding: 6px !important;
          }

          .certificate-container .py-2 {
            padding-top: 2px !important;
            padding-bottom: 2px !important;
          }

          .certificate-container .py-3 {
            padding-top: 2px !important;
            padding-bottom: 2px !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header / Kop */}
        <div className="border-b-2 border-blue-600 pb-2 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-blue-900">LUMA YAZILIM HİZMETLERİ</h1>
              <p className="text-xs text-gray-600">Hosting & Domain Hizmetleri</p>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p>Belge No: {approval.id.substring(0, 13).toUpperCase()}</p>
              <p>Tarih: {getCurrentDate()}</p>
            </div>
          </div>
        </div>

        {/* Belge Başlığı */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            ELEKTRONİK SÖZLEŞME ONAY BELGESİ
          </h2>
          <p className="text-xs text-gray-600">
            (5070 Sayılı Elektronik İmza Kanunu - Hukuki Delil Belgesi)
          </p>
          <div className="mt-2 inline-block px-4 py-1 bg-green-100 border border-green-600 rounded">
            <p className="text-green-800 font-semibold text-sm">
              ✓ ONAYLANDI
            </p>
          </div>
        </div>

        {/* Müşteri Bilgileri */}
        <div className="mb-3">
          <div className="bg-blue-50 border-l-2 border-blue-600 p-2">
            <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-1 text-sm">
              <span>1.</span> MÜŞTERİ BİLGİLERİ
            </h3>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-blue-200">
                  <td className="py-1 font-semibold text-blue-900 w-1/3">Ad Soyad:</td>
                  <td className="py-1">{approval.contract?.customers?.full_name}</td>
                </tr>
                <tr className="border-b border-blue-200">
                  <td className="py-1 font-semibold text-blue-900">E-posta:</td>
                  <td className="py-1">{approval.contract?.customers?.email}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold text-blue-900">Müşteri ID:</td>
                  <td className="py-1 font-mono text-xs">{approval.customer_id}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sözleşme Bilgileri */}
        <div className="mb-3">
          <div className="bg-gray-50 border-l-2 border-gray-600 p-2">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-1 text-sm">
              <span>2.</span> SÖZLEŞME BİLGİLERİ
            </h3>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-1 font-semibold text-gray-900 w-1/3">Sözleşme Adı:</td>
                  <td className="py-1">{approval.contract?.contract_templates?.name}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1 font-semibold text-gray-900">Tip:</td>
                  <td className="py-1">{approval.contract?.contract_templates?.type}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1 font-semibold text-gray-900">Versiyon:</td>
                  <td className="py-1">{approval.contract?.version}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold text-gray-900">Sözleşme ID:</td>
                  <td className="py-1 font-mono text-xs">{approval.customer_contract_id}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* İnkar Edilemezlik Bilgileri - En Önemli Kısım */}
        <div className="mb-3">
          <div className="bg-red-50 border-2 border-red-600 p-2">
            <h3 className="font-bold text-red-900 mb-1 flex items-center gap-1 text-sm">
              <Shield className="h-4 w-4" />
              <span>3.</span> İNKAR EDİLEMEZLİK BİLGİLERİ
            </h3>
            <div className="bg-white p-2 rounded border border-red-200">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 font-semibold text-red-900 w-1/3">Onay Zamanı:</td>
                    <td className="py-1 font-mono text-xs">{formatFullDate(approval.approved_at)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 font-semibold text-red-900">IP Adresi:</td>
                    <td className="py-1 font-mono">{approval.ip_address}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 font-semibold text-red-900">Onay Durumu:</td>
                    <td className="py-1">
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 font-semibold rounded text-xs">
                        {approval.approval_status === 'approved' ? 'ONAYLANDI' : 'REDDEDİLDİ'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 font-semibold text-red-900 align-top">User Agent:</td>
                    <td className="py-1 font-mono text-xs break-all">{approval.user_agent}</td>
                  </tr>
                  {approval.device_fingerprint && (
                    <tr className="border-b border-gray-200">
                      <td className="py-1 font-semibold text-red-900 align-top">Cihaz ID:</td>
                      <td className="py-1 font-mono text-xs break-all">{approval.device_fingerprint}</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-200">
                    <td className="py-1 font-semibold text-red-900 align-top">SHA-256:</td>
                    <td className="py-1 font-mono text-xs break-all bg-gray-50 p-1 rounded">
                      {approval.approval_text_hash}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold text-red-900">Onay ID:</td>
                    <td className="py-1 font-mono text-xs">{approval.id}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Yasal Uyarı */}
        <div className="mb-3 bg-yellow-50 border border-yellow-500 p-2 rounded">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-1 text-sm">YASAL UYARI</h3>
              <div className="text-xs text-yellow-900 space-y-1">
                <p>
                  <strong>1.</strong> 5070 sayılı Elektronik İmza Kanunu kapsamında hukuki delil niteliğindedir.
                </p>
                <p>
                  <strong>2.</strong> Tüm bilgiler (IP, zaman damgası, hash) kayıt altında olup inkar edilemez.
                </p>
                <p>
                  <strong>3.</strong> SHA-256 hash ile sözleşme metni korunmaktadır.
                </p>
                <p>
                  <strong>4.</strong> Mahkeme ve icra dairelerinde delil olarak sunulabilir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / İmza Alanı */}
        <div className="border-t border-gray-300 pt-2 mt-3">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Elektronik belge</p>
              <p className="text-xs text-gray-600">
                Oluşturma: <span className="font-mono">{getCurrentDate()}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block border-t border-gray-400 pt-1 px-4">
                <p className="text-xs font-semibold text-gray-700">SİSTEM YÖNETİCİSİ</p>
                <p className="text-xs text-gray-600">Luma Yazılım</p>
              </div>
            </div>
          </div>

          {/* Belge Alt Bilgi */}
          <div className="bg-gray-100 p-2 rounded text-center">
            <p className="text-xs text-gray-600">
              Luma Yazılım Hizmetleri - Belge doğrulama: Belge No ve Hash
            </p>
            <p className="text-xs text-gray-500 font-mono">
              ID: {approval.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
