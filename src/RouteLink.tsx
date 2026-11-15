import type { MouseEvent, ReactNode } from "react";
import { navigate, routeHref, type Route } from "./route";

/** A real link to a route, so it can be opened in a new tab, that changes view in place on a plain click. */
export function RouteLink({
  to,
  className,
  children,
}: {
  to: Route;
  className?: string;
  children: ReactNode;
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(to);
  };
  return (
    <a href={routeHref(to)} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
