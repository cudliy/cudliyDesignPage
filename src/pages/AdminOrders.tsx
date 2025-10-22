import { useEffect, useState } from 'react'
import { apiService } from '@/services/api'

type OrderRow = {
  id: string
  orderNumber?: string
  status: string
  total: number
  createdAt?: string
  items?: Array<{ designTitle?: string; attributes?: { size?: 'S'|'M'|'L'; inch?: number } }>
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        // For demo/admin, try to load current (guest) user's orders if available
        const userId = sessionStorage.getItem('user_id') || sessionStorage.getItem('guest_user_id')
        if (!userId) {
          setOrders([])
          setLoading(false)
          return
        }
        const res = await apiService.getUserOrders(userId)
        if (res.success && res.data?.orders) {
          const mapped: OrderRow[] = (res.data.orders as any[]).map((o: any) => ({
            id: o.id || o._id,
            orderNumber: o.orderNumber,
            status: o.status,
            total: o.pricing?.total ?? 0,
            createdAt: o.createdAt,
            items: o.items
          }))
          setOrders(mapped)
        } else {
          setError('Failed to load orders')
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading orders…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Orders</h1>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Order #</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">Size</th>
                <th className="text-left px-4 py-3">Inch</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={6}>No orders yet</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{o.orderNumber || o.id}</td>
                    <td className="px-4 py-3 capitalize">{o.status}</td>
                    <td className="px-4 py-3">${o.total?.toFixed?.(2) ?? o.total}</td>
                    <td className="px-4 py-3">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3">{o.items?.[0]?.attributes?.size || '-'}</td>
                    <td className="px-4 py-3">{o.items?.[0]?.attributes?.inch || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


