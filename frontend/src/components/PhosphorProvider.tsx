"use client";

import React from "react";
import { IconContext } from "@phosphor-icons/react";

export function PhosphorProvider({ children }: { children: React.ReactNode }) {
  return (
    <IconContext.Provider
      value={{
        weight: "duotone",
        className: "shrink-0 transition-colors",
      }}
    >
      {children}
    </IconContext.Provider>
  );
}

