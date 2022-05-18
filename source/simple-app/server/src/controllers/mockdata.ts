
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

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