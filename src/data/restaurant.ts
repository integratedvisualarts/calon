import { chaiSocial } from "@/engine/workspaces/chai-social";

/** Who this account is. Opportunity matching reads type, cuisine and tags. */
export type RestaurantProfile = {
  id: string;
  name: string;
  type: string;
  cuisine: string;
  tags: readonly string[];
};

export const chaiSocialProfile: RestaurantProfile = {
  id: chaiSocial.id,
  name: chaiSocial.name,
  type: chaiSocial.type,
  cuisine: chaiSocial.cuisine,
  tags: chaiSocial.tags,
};
