import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPendingContracts } from '@/lib/api/contracts'

/**
 * Müşteri girişinde bekleyen sözleşmeleri kontrol eder
 * ve onay gerekiyorsa modal açar
 */
export function useContractCheck() {
  const [currentContractIndex, setCurrentContractIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)

  const { data: pendingContracts = [], isLoading } = useQuery({
    queryKey: ['pending-contracts'],
    queryFn: getPendingContracts,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    // Bekleyen sözleşme varsa modal'ı aç
    if (pendingContracts.length > 0 && !showModal) {
      setShowModal(true)
      setCurrentContractIndex(0)
    }
  }, [pendingContracts])

  const currentContract = pendingContracts[currentContractIndex] || null

  const handleModalClose = () => {
    // Bir sonraki sözleşmeye geç
    if (currentContractIndex < pendingContracts.length - 1) {
      setCurrentContractIndex(currentContractIndex + 1)
    } else {
      setShowModal(false)
      setCurrentContractIndex(0)
    }
  }

  return {
    currentContract,
    showModal,
    setShowModal: handleModalClose,
    pendingCount: pendingContracts.length,
    isLoading,
  }
}
