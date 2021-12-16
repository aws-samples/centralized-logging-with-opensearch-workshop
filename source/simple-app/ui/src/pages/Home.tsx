import React, { useState, useEffect } from "react";
import { Card, Button, Classes } from "@blueprintjs/core";
import Axios from "../js/request";
import { Product } from "../js/types";
import { Link, useNavigate } from "react-router-dom";
import { Navigation } from "./common/Nav";

const Home = () => {
  const navigate = useNavigate();
  const [loadingImport, setLoadingImport] = useState(false);
  const [productList, setProductList] = useState<Product[]>([]);

  const getProductList = () => {
    Axios.get("/products").then((res) => {
      console.info("res:", res);
      setProductList(res.data);
    });
  };

  const importDemoData = () => {
    setLoadingImport(true);
    Axios.post("/importdemodata")
      .then((res) => {
        window.location.reload();
        setLoadingImport(false);
        console.info("res:", res);
      })
      .catch((err) => {
        console.error(err);
        setLoadingImport(false);
      });
  };

  useEffect(() => {
    getProductList();
  }, []);

  return (
    <div>
      <Navigation />
      <div className="content">
        <div>
          {productList.length > 0 ? (
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
          ) : (
            <div
              style={{
                display: "flex",
                alignContent: "center",
                justifyContent: "center",
                paddingTop: 50,
              }}
              className={Classes.DARK}
            >
              <Button
                onClick={() => {
                  importDemoData();
                }}
                loading={loadingImport}
                icon="import"
              >
                Import Demo Data
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
