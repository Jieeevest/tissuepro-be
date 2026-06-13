declare module 'midtrans-client' {
  interface SnapConfig {
    isProduction: boolean
    serverKey: string
    clientKey: string
  }
  interface TransactionDetail {
    order_id: string
    gross_amount: number
  }
  interface ItemDetail {
    id: string
    name: string
    price: number
    quantity: number
  }
  interface CustomerDetail {
    first_name?: string
    email?: string
    phone?: string
  }
  interface ShippingAddress {
    first_name?: string
    phone?: string
    address?: string
    city?: string
    postal_code?: string
    country_code?: string
  }
  interface CreateTransactionParam {
    transaction_details: TransactionDetail
    item_details?: ItemDetail[]
    customer_details?: CustomerDetail
    shipping_address?: ShippingAddress
  }
  interface SnapTransaction {
    token: string
    redirect_url: string
  }
  class Snap {
    constructor(config: SnapConfig)
    createTransaction(param: CreateTransactionParam): Promise<SnapTransaction>
    transaction: {
      notification(body: Record<string, string>): Promise<Record<string, string>>
    }
  }
}
