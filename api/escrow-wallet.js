import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, trade_id, network } = req.body

  try {
    if (action === 'get_escrow_address') {
      // Return the platform escrow wallet address for the given network
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('*')
        .single()

      const escrowAddress = network === 'trc20'
        ? settings?.escrow_wallet_trc20
        : settings?.escrow_wallet_bsc

      if (!escrowAddress) {
        return res.status(400).json({ error: 'Escrow wallet not configured for this network' })
      }

      return res.status(200).json({ escrow_address: escrowAddress })
    }

    if (action === 'verify_deposit') {
      // Verify that USDT was deposited to the escrow address on-chain
      // This would call TronGrid (TRC20) or BSC scan API
      const { data: trade } = await supabase
        .from('trades')
        .select('*')
        .eq('trade_id', trade_id)
        .single()

      if (!trade) {
        return res.status(404).json({ error: 'Trade not found' })
      }

      // TODO: Implement on-chain verification
      // For TRC20: query TronGrid API for incoming USDT transactions
      // For BSC: query BSCscan API for incoming USDT transactions
      // Compare deposited amount with trade.amount

      return res.status(200).json({
        verified: false,
        message: 'On-chain verification not yet implemented. Manual confirmation required.'
      })
    }

    if (action === 'release_escrow') {
      // Release USDT from escrow wallet to buyer's wallet
      // This would trigger an on-chain transaction from the platform wallet
      const { data: trade } = await supabase
        .from('trades')
        .select('*, buyer:profiles!buyer_id(*)')
        .eq('trade_id', trade_id)
        .single()

      if (!trade) {
        return res.status(404).json({ error: 'Trade not found' })
      }

      if (trade.status !== 'confirming') {
        return res.status(400).json({ error: 'Trade is not in confirming state' })
      }

      // TODO: Implement on-chain transfer
      // For TRC20: use TronWeb to send USDT from escrow wallet to buyer wallet
      // For BSC: use ethers.js to send USDT from escrow wallet to buyer wallet
      // Deduct 0.8% escrow fee

      const fee = trade.amount * 0.008
      const buyerReceives = trade.amount - fee

      return res.status(200).json({
        success: false,
        message: 'On-chain release not yet implemented. Manual release required.',
        buyer_receives: buyerReceives,
        fee: fee,
      })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('Escrow API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
