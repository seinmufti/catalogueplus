export type Product = {
  id: string
  /** Display ID in admin (0001, 0002, …). */
  product_key: string
  name: string
  category: string
  brand: string
  quantity_in_carton: number
  image_path: string | null
  /** Hidden from customer catalogue (stored in Supabase Storage, not the products table). */
  hidden: boolean
  created_at: string
}

export type NewProductInput = {
  name: string
  category: string
  brand: string
  quantityInCarton: number
  image: File
}

export type UpdateProductInput = {
  name: string
  category: string
  brand: string
  quantityInCarton: number
  image?: File | null
}
