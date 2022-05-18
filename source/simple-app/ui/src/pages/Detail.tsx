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

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Navigation } from "./common/Nav";
import Axios from "../js/request";
import { Product } from "../js/types";
import { Card, Button } from "@blueprintjs/core";

const Detail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product>();
  const [loadingData, setLoadingData] = useState(false);
  const nonMemberProducts = ['3'];
  const getProductById = async () => {
    setLoadingData(true);
    let res;
    if (id && nonMemberProducts.includes(id)) {
      console.info('using slowquery to delay page load. Merchant needs to pay membership fee.');
      res = await Axios.get(`api/slow/products/detail/${id}`);
    } else {
      res = await Axios.get(`api/products/detail/${id}`);
    }
    console.info("res:", res);
    setProduct(res.data);
    setLoadingData(false);
  };

  useEffect(() => {
    getProductById();
  }, []);

  return (
    <div>
      <Navigation />
      <div className="content">
        {loadingData ? (
          <div
            style={{ color: "#eee" }}
            className="mt-20 padding-10 text-center"
          >
            Loading Data...
          </div>
        ) : (
          <Card className="example-card product-card">
            <div className="flex">
              <div className="img-border">
                <img
                  width="100%"
                  src={product?.productImage}
                />
              </div>
              <div className="product-info padding-10">
                <div className="name">{product?.productName}</div>
                <div className="price">${product?.productPrice.toFixed(2)}</div>
                <div className="">
                  <Button 
                    icon="shopping-cart" 
                    onClick={() => {
                      // calling an error API to generate some error log.
                      Axios.get('java/hello');
                    }}
                  >
                    Add To Cart
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Detail;
