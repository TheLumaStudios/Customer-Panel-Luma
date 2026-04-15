import { supabase } from '@/lib/supabase'

const callYoncu = async (action, params = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  const baseUrl = import.meta.env.VITE_SUPABASE_URL
  const functionsUrl = baseUrl.includes('/rest/v1')
    ? baseUrl.replace('/rest/v1', '/functions/v1')
    : `${baseUrl}/functions/v1`

  const res = await fetch(`${functionsUrl}/yoncu-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ action, params }),
  })

  const result = await res.json()
  if (!result.success) throw new Error(result.error || 'Yöncü API hatası')
  return result.data
}

/** Tüm sunucuları listele */
export const listYoncuServers = () => callYoncu('list-servers')

/** Sunucu power yönetimi (poweron, poweroff, reset) */
export const yoncuPower = (serverId, operation, serverIp) => {
  const params = { is: operation }
  if (serverId) params.sid = serverId
  if (serverIp) params.sip = serverIp
  return callYoncu('power', params)
}

/** IP RDNS görüntüle */
export const getYoncuRdns = (ip) => callYoncu('rdns', { ip })

/** IP RDNS güncelle */
export const updateYoncuRdns = (ip, rdns) => callYoncu('rdns', { ip, rdns })

/** Kullanılabilir işletim sistemlerini listele */
export const listYoncuSystems = () => callYoncu('systems')

/** IP hat raporu */
export const getYoncuReport = (ip) => callYoncu('report', { ip })

/** MAC adres yönetimi */
export const getYoncuMac = (ip) => callYoncu('mac', { ip, get: 'true' })
export const listYoncuMacs = (ip) => callYoncu('mac', { ip, list: 'true' })
export const addYoncuMac = (ip, mac) => callYoncu('mac', { ip, add: mac })
export const deleteYoncuMac = (ip) => callYoncu('mac', { ip, del: 'true' })

/** IP gelişmiş seçenekleri */
export const getYoncuIpOptions = (ip) => callYoncu('ip-options', { ip, get: 'true' })
export const setYoncuIpOption = (ip, optionId, value) => {
  const params = { ip }
  params[`set${optionId}`] = value ? '1' : '0'
  return callYoncu('ip-options', params)
}
