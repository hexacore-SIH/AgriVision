"use client";

import dynamic from "next/dynamic";
import { CircularProgress, Box } from "@mui/material";

export const MandiMap = dynamic(
  () => import("./MandiMap").then((mod) => mod.MandiMap),
  {
    ssr: false,
    loading: () => (
      <Box display="flex" alignItems="center" justifyContent="center" height={380}>
        <CircularProgress size={28} />
      </Box>
    ),
  }
);

export type { MapMandi } from "./MandiMap";
