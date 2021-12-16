import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Navigation } from "./common/Nav";
import Axios from "../js/request";
import { Product } from "../js/types";
import { Card, Button } from "@blueprintjs/core";

const Detail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product>();

  const getProductById = () => {
    Axios.get(`/products/detail/${id}`).then((res) => {
      console.info("res:", res);
      setProduct(res.data);
    });
  };

  useEffect(() => {
    getProductById();
  }, []);

  return (
    <div>
      <Navigation />
      <div className="content">
        <Card className="example-card product-card">
          <div className="flex">
            <div className="img-border">
              <img
                width="100%"
                src={`https://dummyimage.com/600x400/30404d/fff&text=${product?.productName}`}
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
      </div>
    </div>
  );
};

export default Detail;
