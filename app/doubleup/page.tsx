"use client";

import {
  DoubleUpScreen,
} from "@/features/double-up/components/DoubleUpScreen";
import {
  Suspense,
} from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DoubleUpScreen />
    </Suspense>
  );
}
