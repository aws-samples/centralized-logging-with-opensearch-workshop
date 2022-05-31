/*
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the terms of the LICENSE file distributed with this project.
 */

import { MenuItem } from "@blueprintjs/core";
import { ItemRenderer } from "@blueprintjs/select";
import React from "react";
import { ProductTypes } from "./types";

export const renderSelect: ItemRenderer<ProductTypes> = (
  item,
  { handleClick, modifiers, query }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  const text = `${item.productTypeName}`;
  return (
    <MenuItem
      style={{ width: "100%" }}
      active={modifiers.active}
      disabled={modifiers.disabled}
      label={item.productTypeName}
      key={item.id}
      onClick={handleClick}
      text={highlightText(text, query)}
    />
  );
};

function highlightText(text: string, query: string) {
  const lastIndex = 0;
  const words = query
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map(escapeRegExpChars);
  if (words.length === 0) {
    return [text];
  }
  // const regexp = new RegExp(words.join("|"), "gi");
  const tokens: React.ReactNode[] = [];

  const rest = text.slice(lastIndex);
  if (rest.length > 0) {
    tokens.push(rest);
  }
  return tokens;
}

function escapeRegExpChars(text: string) {
  return text.replace(/([.*+?^=!:${}()|\\[\]\\/\\])/g, "\\$1");
}
