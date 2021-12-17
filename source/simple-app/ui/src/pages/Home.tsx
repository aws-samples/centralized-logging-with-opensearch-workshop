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
  const [loadingData, setLoadingData] = useState(true);

  const getProductList = () => {
    Axios.get("/products").then((res) => {
      console.info("res:", res);
      setProductList(res.data);
      setLoadingData(false);
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
        {loadingData ? (
          <div
            style={{ color: "#eee" }}
            className="mt-20 padding-10 text-center"
          >
            Loading Data...
          </div>
        ) : (
          <div>
            {productList.length > 0 ? (
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
                  disabled={loadingImport}
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
        )}
      </div>
    </div>
  );
};

export default Home;
