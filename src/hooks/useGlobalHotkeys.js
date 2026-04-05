import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from 'react-router-dom'

export function useGlobalHotkeys() {
  const navigate = useNavigate()

  // Shift+N → Yeni Müşteri (admin)
  useHotkeys('shift+n', (e) => {
    e.preventDefault()
    // Dispatch custom event that Customers page listens to
    window.dispatchEvent(new CustomEvent('hotkey:new-customer'))
  }, { enableOnFormTags: false })

  // Shift+I → Yeni Fatura
  useHotkeys('shift+i', (e) => {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('hotkey:new-invoice'))
  }, { enableOnFormTags: false })

  // Shift+T → Yeni Destek Talebi
  useHotkeys('shift+t', (e) => {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('hotkey:new-ticket'))
  }, { enableOnFormTags: false })

  // G then D → Domain sayfasına git
  useHotkeys('g+d', () => navigate('/admin/domains'), { enableOnFormTags: false })

  // G then H → Hosting sayfasına git
  useHotkeys('g+h', () => navigate('/admin/hosting'), { enableOnFormTags: false })

  // G then C → Müşteriler sayfasına git
  useHotkeys('g+c', () => navigate('/admin/customers'), { enableOnFormTags: false })

  // ? → Kısayol yardımı
  useHotkeys('shift+/', (e) => {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('hotkey:show-help'))
  }, { enableOnFormTags: false })
}
