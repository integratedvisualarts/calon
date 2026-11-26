"use client";
import "@/data/live";

import { AskPanel } from "@/components/ask-panel";
import { CampaignsScreen } from "@/components/campaigns-screen";
import { HomeScreen } from "@/components/home-screen";
import { OpportunitiesScreen } from "@/components/opportunities-screen";
import { InsightsScreen } from "@/components/insights-screen";
import { ProfileScreen } from "@/components/profile-screen";
import { ReviewsScreen } from "@/components/reviews-screen";
import { SalesScreen } from "@/components/sales-screen";
import { Shell } from "@/components/shell";
import { Splash } from "@/components/splash";
import { AppErrorBoundary, NotFound } from "@/components/route-states";
import { VisibilityScreen } from "@/components/visibility-screen";
import { StoreProvider, useStore } from "@/lib/store";

export function App() {
  return (
    <StoreProvider>
      <AppErrorBoundary>
        <Splash />
        <Workspace />
      </AppErrorBoundary>
    </StoreProvider>
  );
}

function Workspace() {
  const store = useStore();
  if (!store.hydrated) {
    return (
      <main className="grid min-h-screen place-items-center bg-navy px-6 text-center text-ink">
        <div>
          <p className="font-serif text-4xl">Calon</p>
          <p className="mt-2 text-mist">Growth with heart. Built in Wales.</p>
        </div>
      </main>
    );
  }
  if (store.notFound) {
    return (
      <Shell>
        <NotFound />
      </Shell>
    );
  }
  return (
    <Shell>
      {store.screen === "home" ? <HomeScreen /> : null}
      {store.screen === "opportunities" ? <OpportunitiesScreen /> : null}
      {store.screen === "visibility" ? <VisibilityScreen /> : null}
      {store.screen === "insights" ? <InsightsScreen /> : null}
      {store.screen === "campaigns" ? <CampaignsScreen /> : null}
      {store.screen === "reviews" ? <ReviewsScreen /> : null}
      {store.screen === "profile" ? <ProfileScreen /> : null}
      {store.screen === "sales" ? <SalesScreen /> : null}
      <AskPanel />
    </Shell>
  );
}
