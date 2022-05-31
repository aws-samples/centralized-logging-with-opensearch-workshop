export interface ProductTypes {
  id: number
  productTypeName: string
}

export interface Product {
  id: number
  productName: string
  productPrice: number
  productImage: string
  productTypeId: string
}
