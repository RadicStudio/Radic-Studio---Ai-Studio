import { getRouteApi } from "@tanstack/react-router";

const rootApi = getRouteApi("__root__");

/** Site-wide settings and social links loaded by the root route. */
export function useSiteShell() {
  return rootApi.useLoaderData();
}
