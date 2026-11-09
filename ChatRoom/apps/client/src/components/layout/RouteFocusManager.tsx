
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function RouteFocusManager() {
  const location = useLocation();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    if (previousPath.current === location.pathname) {
      return;
    }

    previousPath.current = location.pathname;

    const main = document.getElementById("main-content");

    main?.focus({ preventScroll: true });

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return null;
}
