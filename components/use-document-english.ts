"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const serverSnapshot = () => false;
function snapshot() {
  const locale = document.cookie.match(/(?:^|;\s*)faktudash_locale=(es|en)(?:;|$)/)?.[1];
  return (locale ?? document.documentElement.lang) === "en";
}

export function useDocumentEnglish() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
