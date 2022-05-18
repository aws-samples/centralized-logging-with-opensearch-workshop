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

import React, { useState, useEffect } from "react";
import { Card, Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import Swal from "sweetalert2";

import { renderSelect } from "../js/select";
import Axios from "../js/request";
import { Navigation } from "./common/Nav";
import { ProductTypes } from "../js/types";
interface Product {
  productId?: string;
  productTypeId: string;
  productName: string;
  productPrice: string;
  productImage: string;
}

const RESET_PRODUCT = {
  productTypeId: "",
  productName: "",
  productPrice: "",
  productImage: "",
};

const FilmSelect = Select.ofType<ProductTypes>();

const Create = () => {
  const [product, setProduct] = useState<Product>(RESET_PRODUCT);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [productType, setProductType] = useState<ProductTypes>();
  const [productTypeList, setProductTypeList] = useState<ProductTypes[]>([]);
  // const [film, setFilm] = useState<IFilm>(TOP_100_FILMS[0]);

  const createProduct = () => {
    product.productTypeId = productType?.id?.toString() || "0";
    setLoadingCreate(true);
    Axios.post("api/product", product)
      .then((res) => {
        console.info("res:", res);
        setProduct(RESET_PRODUCT);
        setLoadingCreate(false);
        Swal.fire({
          icon: "success",
          text: "Add Successful.",
          confirmButtonColor: "#3085d6",
        });
      })
      .catch((err) => {
        console.error(err);
        setLoadingCreate(false);
      });
  };

  const getProductType = () => {
    Axios.get("api/producttypes").then((res) => {
      console.info("res:", res);
      setProductTypeList(res.data);
      if (res.data && res.data.length > 0) {
        setProductType(res.data[0]);
      }
    });
  };

  useEffect(() => {
    getProductType();
  }, []);

  return (
    <div>
      <Navigation />
      <div className="create-box">
        <Card className="mt-20 example-card bp3-dark">
          <div className="example-header text-center">
            <b>Add New Product</b>
          </div>
          <div className="mt-10 padding-10">
            <div className="add-category">
              <div className="label">Product Category</div>
              <FilmSelect
                filterable={false}
                items={productTypeList}
                itemRenderer={renderSelect}
                noResults={<MenuItem disabled={true} text="No results." />}
                onItemSelect={setProductType}
              >
                <Button
                  text={productType?.productTypeName}
                  rightIcon="caret-down"
                />
              </FilmSelect>
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
                loading={loadingCreate}
                disabled={loadingCreate}
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
    </div>
  );
};

export default Create;
