import { activeWorkspace } from "@/data/current";

/** Who this account is. Opportunity matching reads type, cuisine and tags. */
export type RestaurantProfile = {
  id: string;
  name: string;
  type: string;
  cuisine: string;
  tags: readonly string[];
};

export const activeProfile: RestaurantProfile = {
  id: activeWorkspace.id,
  name: activeWorkspace.name,
  type: activeWorkspace.type,
  cuisine: activeWorkspace.cuisine,
  tags: activeWorkspace.tags,
};
