import React, { useState, useEffect } from "react";
import { Card, Button } from "@blueprintjs/core";
import Axios from "../js/request";
import { Product } from "../js/types";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Navigation } from "./common/Nav";

const Catetory = () => {
  const [productList, setProductList] = useState<Product[]>([]);
  const { id } = useParams();
  const navigate = useNavigate();

  const getProductListByType = () => {
    Axios.get(`/products/type/${id}`).then((res) => {
      console.info("res:", res);
      setProductList(res.data);
    });
  };

  useEffect(() => {
    getProductListByType();
  }, []);

  return (
    <div>
      <Navigation />
      <div className="content">
        <div>
          <div className="flex">
            {productList.map((element: Product, index: number) => {
              return (
                <div className="product-item" key={index}>
                  <Card className="example-card product-card">
                    <div>
                      <Link to={`/detail/${element.id}`}>
                        <img
                          width="100%"
                          src={`https://dummyimage.com/600x400/30404d/fff&text=${element.productName}`}
                        />
                      </Link>
                    </div>
                    <div className="name">{element.productName}</div>
                    <div className="price">${element.productPrice}</div>
                    <div>
                      <Button
                        onClick={() => {
                          navigate("/detail/" + element.id);
                        }}
                        style={{ width: "100%" }}
                      >
                        View Detail
                      </Button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catetory;
