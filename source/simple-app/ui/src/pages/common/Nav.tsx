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
import { useNavigate, useParams } from "react-router-dom";
import {
  Alignment,
  AnchorButton,
  Classes,
  Navbar,
  NavbarGroup,
  NavbarHeading,
  NavbarDivider,
  Button,
} from "@blueprintjs/core";
import Axios from "../../js/request";
import { ProductTypes } from "../../js/types";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NavigationProps {}

export const Navigation: React.FC<NavigationProps> = () => {
  const navigate = useNavigate();
  const { typeId } = useParams();
  console.info("typeId", typeId);
  const [productTypeList, setProductTypeList] = useState<ProductTypes[]>([]);

  const getProductType = () => {
    Axios.get("api/producttypes").then((res) => {
      console.info("res:", res);
      setProductTypeList(res.data);
    });
  };

  useEffect(() => {
    getProductType();
  }, []);

  return (
    <Navbar className={Classes.DARK}>
      <NavbarGroup align={Alignment.LEFT}>
        <NavbarHeading>
          <b>Centralized Logging with OpenSearch Workshop</b>
        </NavbarHeading>
        <NavbarDivider />
        <Button
          onClick={() => {
            navigate("/");
          }}
          alignText={Alignment.RIGHT}
          text=""
          minimal
        >
          Home
        </Button>
        {productTypeList.map((element: ProductTypes, index) => {
          return (
            <Button
              active={element.id == (typeId || -1)}
              minimal
              onClick={() => {
                window.location.href = "/type/" + element.id;
                // navigate('/type/' + element.id)
              }}
              style={{ marginLeft: 10, minWidth: 100 }}
              key={index}
            >
              {element.productTypeName}
            </Button>
          );
        })}
      </NavbarGroup>
      <NavbarGroup align={Alignment.RIGHT}>
        <Button
          icon="plus"
          className="mr-10"
          onClick={() => {
            navigate("/create");
          }}
          text=""
        >
          Add Product
        </Button>

        <Button
          onClick={() => {
            navigate("/generate-log");
          }}
          alignText={Alignment.RIGHT}
          text=""
        >
          Generate Logs
        </Button>

        <AnchorButton
          href="http://www.amazonaws.cn"
          text="Docs"
          target="_blank"
          minimal
          rightIcon="share"
        />
      </NavbarGroup>
    </Navbar>
  );
};
