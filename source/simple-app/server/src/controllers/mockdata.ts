
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
  { productName: "Javascript Master", productPrice: 10.00, productImage: "https://$WORKSHOP_CDN_DOMAIN/Javascript-Master.png", productTypeId:"1" }, 
  { productName: "Python Release", productPrice: 20.00, productImage: "https://$WORKSHOP_CDN_DOMAIN/Python-Release.png", productTypeId:"1" }, 
  { productName: "Funny Moto", productPrice: 100.00, productImage: "https://$WORKSHOP_CDN_DOMAIN/Funny-Moto.png", productTypeId:"2" }, 
]

export const MOCK_PRODUCTS_TYPE: ProductType[] = [
  { id: 1, productTypeName:"Books" }, 
  { id: 2, productTypeName: "Toys" }, 
]