import { visibility, type Mention } from "@/data/demo-data";

export type EngineCard = {
  id: string;
  engine: string;
  question: string;
  mention: Mention;
  note: string;
  hook: string;
  fixId: string;
};

export function engineCards(mode: "ai" | "seo"): EngineCard[] {
  const prompts = visibility.prompts[mode];
  const focus = prompts.find((item) => item.question === "chai near me") ?? prompts[0];
  const engines = focus?.engines.map((engine) => engine.engine) ?? [];
  return engines.map((engine) => {
    const row = focus?.engines.find((item) => item.engine === engine);
    const mention = row?.mention ?? "absent";
    const question = focus?.question ?? "chai near me";
    const verb = mention === "ranked" ? "ranks you for" : mention === "mentioned" ? "names you for" : "skips you for";
    const fixId =
      question.includes("hour") || question.includes("open") || question.includes("late")
        ? "hours"
        : question.includes("chai")
          ? "reviews-ask"
          : "faq";
    return {
      id: `${mode}-${engine}`,
      engine,
      question,
      mention,
      note: row?.note ?? "",
      hook: `${engine} ${verb} “${question}”`,
      fixId,
    };
  });
}
