"use client";

import { useEffect } from "react";

/** Also handles programmatic draft restoration and dynamically added invoice rows. */
export function TextareaAutosize() {
  useEffect(() => {
    const resize = (element: HTMLTextAreaElement) => {
      element.style.height = "auto";
      element.style.height = `${Math.min(element.scrollHeight + 2, 384)}px`;
    };
    const resizeAll = () => document.querySelectorAll("textarea").forEach(resize);
    const onInput = (event: Event) => {
      if (event.target instanceof HTMLTextAreaElement) resize(event.target);
    };
    const observer = new MutationObserver(resizeAll);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", onInput);
    window.addEventListener("resize", resizeAll);
    resizeAll();
    return () => {
      observer.disconnect();
      document.removeEventListener("input", onInput);
      window.removeEventListener("resize", resizeAll);
    };
  }, []);
  return null;
}
