/**
 * Which restaurant this browser shows. The sign-in sets a readable cookie with the workspace id
 * (the signed session cookie is what actually protects the pages). Read once, when the page loads.
 * On the server it is never used to render restaurant content: the app shows a neutral screen
 * until it has started in the browser.
 */
import { brothers } from "@/engine/workspaces/brothers";
import { chaiSocial } from "@/engine/workspaces/chai-social";
import type { Workspace } from "@/engine/types";

export const workspaces: Record<string, Workspace> = {
  [chaiSocial.id]: chaiSocial,
  [brothers.id]: brothers,
};

export const DEFAULT_WORKSPACE_ID = chaiSocial.id;

function pickId(): string {
  if (typeof document === "undefined") return DEFAULT_WORKSPACE_ID;
  const m = document.cookie.match(/(?:^|;\s*)calon_ws=([^;]+)/);
  const id = m ? decodeURIComponent(m[1]) : "";
  return workspaces[id] ? id : DEFAULT_WORKSPACE_ID;
}

export const activeId = pickId();
export const activeWorkspace: Workspace = workspaces[activeId];
