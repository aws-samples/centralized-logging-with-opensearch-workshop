
export interface Product {
  id?: number
  productName: string
  productPrice: number
  productImage: string
  productTypeId: string
}

export interface ProductType {
  id?: number
  productTypeName: string;
}

export const MOCK_PRODUCTS: Product[] = [
  { productName: "Javascript Master", productPrice: 10.00, productImage: "xxx", productTypeId:"1" }, 
  { productName: "Python Relase", productPrice: 20.00, productImage: "xxx", productTypeId:"1" }, 
  { productName: "Funny Moto", productPrice: 100.00, productImage: "xxx", productTypeId:"2" }, 
]

export const MOCK_PRODUCTS_TYPE: ProductType[] = [
  { id: 1, productTypeName:"Book" }, 
  { id: 2, productTypeName: "Toy" }, 
]