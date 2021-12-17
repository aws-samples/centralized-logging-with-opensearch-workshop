import React, { useState, useEffect } from "react";
import { Card, Button } from "@blueprintjs/core";
import Axios from "../js/request";
import { Product } from "../js/types";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Navigation } from "./common/Nav";

const Catetory = () => {
  const [productList, setProductList] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const { typeId } = useParams();
  const navigate = useNavigate();

  const getProductListByType = () => {
    setLoadingData(true);
    Axios.get(`/products/type/${typeId}`).then((res) => {
      console.info("res:", res);
      setProductList(res.data);
      setLoadingData(false);
    });
  };

  useEffect(() => {
    getProductListByType();
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
          <div>
            <div className="flex no-flex-warp">
              {productList.map((element: Product, index: number) => {
                return (
                  <div className="product-item" key={index}>
                    <Card className="example-card product-card">
                      <div>
                        <Link to={`/detail/${element.id}`}>
                          <img
                            width="100%"
                            src={element.productImage}
                          />
                        </Link>
                      </div>
                      <div className="name">{element.productName}</div>
                      <div className="price">
                        ${element.productPrice.toFixed(2)}
                      </div>
                      <div>
                        <Button
                          rightIcon="arrow-right"
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
        )}
      </div>
    </div>
  );
};

export default Catetory;
