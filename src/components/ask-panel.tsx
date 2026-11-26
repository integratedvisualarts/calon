"use client";

import { CalonMark } from "@/components/brand";
import { business, chat } from "@/data/demo-data";
import { Bars } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function AskPanel() {
  const store = useStore();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (store.chatOpen) end.current?.scrollIntoView({ block: "end" });
  }, [store.chatOpen, store.messages.length]);

  return (
    <Dialog open={store.chatOpen} onOpenChange={store.setChat}>
      <DialogContent
        showCloseButton
        className="top-auto bottom-0 flex max-h-[88vh] w-full max-w-lg translate-y-0 flex-col gap-0 overflow-hidden rounded-t-card border-line bg-navy-2 p-0 sm:max-w-lg lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2 lg:rounded-card"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 pr-12">
          <div>
            <button
              type="button"
              onClick={() => store.back()}
              className="mb-1 inline-flex min-h-11 items-center gap-1 text-[#F4EEE1] hover:text-[#C4A15A] focus-visible:text-[#C4A15A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4A15A]"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
              <span className="font-medium">{store.backLabel}</span>
            </button>
            <div className="mb-1 flex items-center gap-2 text-[#F4EEE1]">
              <CalonMark tone="cream" className="h-7 w-7" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="font-serif text-2xl text-ink">Ask Calon</DialogTitle>
            </div>
            <DialogDescription className="text-[0.8rem] text-faint">Square, Google and the rota for {business.name}.</DialogDescription>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto px-4 py-4">
          {store.messages.length === 0 ? (
            <div className="grid gap-2">
              <p className="text-mist">Try one of these.</p>
              {chat.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="min-h-11 rounded-xl border border-line bg-surface px-3 py-2 text-left"
                  onClick={() => store.sendChat(item.prompt)}
                >
                  {item.prompt}
                </button>
              ))}
            </div>
          ) : (
            store.messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === "user"
                    ? "max-w-[90%] justify-self-end rounded-2xl bg-saffron px-3 py-2 text-saffron-ink"
                    : "grid max-w-full gap-2 rounded-2xl bg-surface px-3 py-3"
                }
              >
                <p>{message.text}</p>
                {message.bars ? <Bars data={message.bars} /> : null}
                {message.card ? (
                  <div className="rounded-xl bg-navy-2 p-3">
                    <p className="text-[0.8rem] text-saffron">{message.card.title}</p>
                    <p>{message.card.body}</p>
                  </div>
                ) : null}
                {message.source ? <p className="text-[0.8rem] text-faint">{message.source}</p> : null}
              </article>
            ))
          )}
          {store.messages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {chat.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="min-h-11 rounded-full border border-line px-3 text-left text-[0.8rem]"
                  onClick={() => store.sendChat(item.prompt)}
                >
                  {item.prompt}
                </button>
              ))}
            </div>
          ) : null}
          <div ref={end} />
        </div>
        <form
          className="flex gap-2 border-t border-line p-3"
          onSubmit={(event) => {
            event.preventDefault();
            store.sendChat(text);
            setText("");
          }}
        >
          <label className="sr-only" htmlFor="ask-input">
            Your question
          </label>
          <Input
            id="ask-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ask about today"
            className="h-12 flex-1 rounded-full border-line bg-[#F4EEE1] px-4 text-base text-[#2B2B2B] md:text-base"
          />
          <Button type="submit" className="h-12 rounded-full bg-saffron px-4 font-semibold text-saffron-ink hover:bg-saffron/90">
            Send
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
