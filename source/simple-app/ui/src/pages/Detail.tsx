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
      // calling an error API to generate some error log.
      Axios.get('java/hello');
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
                  <Button icon="shopping-cart">Add To Cart</Button>
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
