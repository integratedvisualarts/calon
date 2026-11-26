"use client";

import { useStore } from "@/lib/store";
import { Component, type ReactNode } from "react";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-[#0E2A20] px-6 text-center text-[#F4EEE1]">
        <div className="grid max-w-sm gap-3">
          <h1 className="font-serif text-4xl">Something slipped</h1>
          <p>The page did not finish. Your drafts are still in this browser.</p>
          <button
            type="button"
            className="h-11 rounded-full bg-[#C4A15A] font-semibold text-[#1F4D3A]"
            onClick={() => {
              this.setState({ failed: false });
              window.location.assign("/");
            }}
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }
}

export function NotFound() {
  const store = useStore();
  return (
    <div className="grid gap-3 py-10">
      <h1 className="font-serif text-4xl text-ink">That page is not here</h1>
      <p className="text-mist">The link does not match a screen in this account.</p>
      <button type="button" className="h-11 justify-self-start font-semibold text-[#7A5E28]" onClick={() => store.go("home")}>
        Back to Home
      </button>
    </div>
  );
}
