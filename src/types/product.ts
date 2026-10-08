export type Product = {
  id: string
  name: string
  category: string
  quantity_in_carton: number
  image_path: string | null
  revealed: boolean
  created_at: string
}

export type NewProductInput = {
  name: string
  category: string
  quantityInCarton: number
  image: File
}
