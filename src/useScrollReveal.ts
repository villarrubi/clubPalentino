import { useEffect, type RefObject } from "react";

/** Progressive enhancement: content stays readable without the observer. */
export function useScrollReveal(
  root: RefObject<HTMLElement | null>,
  route: string,
) {
  useEffect(() => {
    const container = root.current;
    if (!container || !("IntersectionObserver" in window)) return;
    const elements = [
      ...container.querySelectorAll<HTMLElement>("[data-reveal]"),
    ];
    let observer: IntersectionObserver | undefined;

    const show = (element: HTMLElement) => {
      element.classList.remove("reveal-pending");
      observer?.unobserve(element);
    };
    const reset = () => {
      observer?.disconnect();
      elements.forEach((element) => {
        element.classList.remove("reveal-pending", "reveal-ready");
      });
    };
    const start = () => {
      reset();
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) show(entry.target as HTMLElement);
          });
        },
        { rootMargin: "0px 0px -64px 0px", threshold: 0.12 },
      );
      elements.forEach((element) => {
        // Never hide the first screen or content already reached by the reader.
        if (element.getBoundingClientRect().top < innerHeight) return;
        element.classList.add("reveal-pending");
        observer!.observe(element);
      });
      // Establish the starting style before enabling transitions.
      void container.offsetHeight;
      elements.forEach((element) => element.classList.add("reveal-ready"));
    };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-reveal]");
      if (element) {
        element.classList.remove("reveal-ready");
        show(element);
      }
    };
    start();
    container.addEventListener("focusin", focus);
    return () => {
      reset();
      container.removeEventListener("focusin", focus);
    };
  }, [root, route]);
}
