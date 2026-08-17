import React from "react";

export const TwoDiv = ({ children }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="d-flex w-100 align-items-center justify-content-between gap-3">
    {children}
  </div>
);
