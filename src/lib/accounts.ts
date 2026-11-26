/**
 * Demo sign-ins (Step A). Each account opens exactly one restaurant.
 * Passwords live only in Vercel env vars. In Step B these move to the control database.
 */
export type DemoAccount = { username: string; workspace: string; passwordEnv: string; label: string };

export const demoAccounts: DemoAccount[] = [
  { username: "chai", workspace: "chai-social", passwordEnv: "DEMO_CHAI_PASSWORD", label: "Chefs of India" },
  { username: "brothers", workspace: "brothers-pontyclun", passwordEnv: "DEMO_BROTHERS_PASSWORD", label: "Brothers Contemporary Indian Cuisine" },
];
