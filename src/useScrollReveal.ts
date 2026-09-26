import { useEffect, type RefObject } from "react";

/** Animate first-screen public content and observe sections, including async lists. */
export function useScrollReveal(
  root: RefObject<HTMLElement | null>,
  route: string,
) {
  useEffect(() => {
    const container = root.current;
    if (!container || !("IntersectionObserver" in window)) return;
    const elements = new Set<HTMLElement>();
    const clear = (element: HTMLElement) => {
      element.classList.remove(
        "reveal-pending",
        "reveal-ready",
        "reveal-initial",
      );
    };
    const show = (element: HTMLElement) => {
      element.classList.remove("reveal-pending");
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) show(entry.target as HTMLElement);
        });
      },
      { rootMargin: "0px 0px -64px 0px", threshold: 0.12 },
    );

    const register = () => {
      for (const element of elements) {
        if (!container.contains(element)) {
          observer.unobserve(element);
          clear(element);
          elements.delete(element);
        }
      }
      const added = [
        ...container.querySelectorAll<HTMLElement>("[data-reveal]"),
      ].filter((element) => !elements.has(element));
      added.forEach((element) => {
        elements.add(element);
        const { top, bottom } = element.getBoundingClientRect();
        if (element.contains(document.activeElement)) return;
        if (top < innerHeight) {
          if (bottom > 0 && element.closest(".public-page"))
            element.classList.add("reveal-initial");
          return;
        }
        element.classList.add("reveal-pending");
        observer.observe(element);
      });
      if (!added.length) return;
      // Establish the starting style before enabling transitions.
      void container.offsetHeight;
      added.forEach((element) => element.classList.add("reveal-ready"));
    };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-reveal]");
      if (
        element &&
        (element.classList.contains("reveal-pending") ||
          event.target.matches(":focus-visible"))
      ) {
        clear(element);
        show(element);
      }
    };
    register();
    const mutations = new MutationObserver(register);
    mutations.observe(container, { childList: true, subtree: true });
    container.addEventListener("focusin", focus);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      elements.forEach(clear);
      container.removeEventListener("focusin", focus);
    };
  }, [root, route]);
}
