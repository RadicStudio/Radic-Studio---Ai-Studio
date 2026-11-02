import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Start loading a page's data when a link is hovered or touched, so the click feels instant.
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    // Keep preloaded data for 30 s so the click uses it instead of fetching again.
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
