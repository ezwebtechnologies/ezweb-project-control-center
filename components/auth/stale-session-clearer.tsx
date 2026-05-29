"use client";

import { useEffect } from "react";
import { clearStaleSession } from "@/app/actions/auth";

/** Removes orphaned session cookies left after a DB reset. */
export function StaleSessionClearer() {
  useEffect(() => {
    void clearStaleSession();
  }, []);

  return null;
}
