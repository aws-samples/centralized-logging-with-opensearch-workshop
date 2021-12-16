import React, { useState } from "react";
import { Card, Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { filterFilm, renderFilm, IFilm, TOP_100_FILMS } from "../js/films";
import Axios from "../js/request";
interface Product {
  productId: string;
  productType: string;
  productName: string;
  productPrice: string;
  productImage: string;
}

const FilmSelect = Select.ofType<IFilm>();

const Create = () => {
  const [product, setProduct] = useState<Product>({
    productId: "",
    productType: "",
    productName: "",
    productPrice: "",
    productImage: "",
  });
  const [film, setFilm] = useState<IFilm>(TOP_100_FILMS[0]);

  const createProduct = () => {
    Axios.post("/products", product).then((res) => {
      console.info("res:", res);
    });
  };

  return (
    <div className="create-box">
      <Card className="example-card bp3-dark">
        <div className="example-header text-center">
          <b>Add New Product</b>
        </div>
        <div className="mt-10 padding-10">
          <div className="">
            <div className="label">Product Category</div>
            <FilmSelect
              items={TOP_100_FILMS}
              itemPredicate={filterFilm}
              itemRenderer={renderFilm}
              noResults={<MenuItem disabled={true} text="No results." />}
              onItemSelect={setFilm}
            >
              <Button text={film.title} rightIcon="caret-down" />
            </FilmSelect>
            {/* <input
              className="bp3-input bp3-intent-primary modifier bp3-fill"
              type="text"
              placeholder=""
              value={product?.productType || ""}
              dir="auto"
              onChange={(event) => {
                setProduct((prev) => {
                  return { ...prev, productType: event.target.value };
                });
              }}
            /> */}
          </div>

          <div className=" mt-10">
            <div className="label">Product Name</div>
            <input
              className="bp3-input bp3-intent-primary modifier bp3-fill"
              type="text"
              placeholder=""
              value={product.productName}
              dir="auto"
              onChange={(event) => {
                setProduct((prev) => {
                  return { ...prev, productName: event.target.value };
                });
              }}
            />
          </div>

          <div className=" mt-10">
            <div className="label">Product Price</div>
            <input
              className="bp3-input bp3-intent-primary modifier bp3-fill"
              type="number"
              placeholder=""
              value={product.productPrice}
              dir="auto"
              onChange={(event) => {
                setProduct((prev) => {
                  return { ...prev, productPrice: event.target.value };
                });
              }}
            />
          </div>

          <div className=" mt-10">
            <div className="label">Product Image</div>
            <input
              className="bp3-input bp3-intent-primary modifier bp3-fill"
              type="text"
              placeholder=""
              value={product.productImage}
              dir="auto"
              onChange={(event) => {
                setProduct((prev) => {
                  return { ...prev, productImage: event.target.value };
                });
              }}
            />
          </div>

          <div className="mt-20 text-center">
            <Button
              style={{ width: "100%" }}
              type="button"
              className="bp3-button bp3-intent-primary bp3-round modifier"
              onClick={() => {
                createProduct();
              }}
            >
              Add Product
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Create;
