import React from "react";
import { AnimationProvider } from "../components/AnimationPauseControl";

// Default implementation, that you can customize
export default function Root({ children }) {
  return <AnimationProvider>{children}</AnimationProvider>;
}
