import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { connectBscWallet, connectTrc20Wallet, getWalletAddress, isWalletAvailable } from '../lib/escrow'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [bscAddress, setBscAddress] = useState(null)
  const [trc20Address, setTrc20Address] = useState(null)
  const [connecting, setConnecting] = useState(false)

  // Check for already-connected wallets on mount
  useEffect(() => {
    if (isWalletAvailable('bsc') && window.ethereum.selectedAddress) {
      setBscAddress(window.ethereum.selectedAddress)
    }
    if (isWalletAvailable('trc20') && window.tronWeb?.defaultAddress) {
      setTrc20Address(window.tronWeb.defaultAddress.base58)
    }

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setBscAddress(accounts[0] || null)
      })
    }
  }, [])

  const connectBsc = useCallback(async () => {
    setConnecting(true)
    try {
      const { address } = await connectBscWallet()
      setBscAddress(address)
      return address
    } catch (err) {
      throw err
    } finally {
      setConnecting(false)
    }
  }, [])

  const connectTrc20 = useCallback(async () => {
    setConnecting(true)
    try {
      const { address } = await connectTrc20Wallet()
      setTrc20Address(address)
      return address
    } catch (err) {
      throw err
    } finally {
      setConnecting(false)
    }
  }, [])

  const getWalletForNetwork = useCallback((network) => {
    if (network === 'trc20') return trc20Address
    return bscAddress
  }, [bscAddress, trc20Address])

  const value = {
    bscAddress,
    trc20Address,
    connecting,
    connectBsc,
    connectTrc20,
    getWalletForNetwork,
    isBscConnected: !!bscAddress,
    isTrc20Connected: !!trc20Address,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
