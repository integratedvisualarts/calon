type LogoProps = {
  className?: string;
  /** Cream artwork for dark green. Green artwork for cream. */
  tone?: "cream" | "green";
};

const mark = {
  cream: "/brand/calon-mark-transparent-reverse.svg",
  green: "/brand/calon-mark-transparent.svg",
};

const wordmark = {
  cream: "/brand/calon-wordmark-transparent-reverse.svg",
  green: "/brand/calon-wordmark-transparent.svg",
};

const lockup = {
  cream: "/brand/calon-lockup-horizontal-transparent-reverse.svg",
  green: "/brand/calon-lockup-horizontal-transparent.svg",
};

export function CalonMark({ className, tone = "cream" }: LogoProps) {
  return (
    <img
      src={mark[tone]}
      alt=""
      width={220}
      height={220}
      className={className ?? "h-9 w-9"}
    />
  );
}

export function CalonWordmark({ className, tone = "cream" }: LogoProps) {
  return (
    <img
      src={wordmark[tone]}
      alt="Calon"
      width={513}
      height={192}
      className={className ?? "h-8 w-auto"}
    />
  );
}

export function CalonLockup({ className, tone = "cream" }: LogoProps) {
  return (
    <img
      src={lockup[tone]}
      alt="Calon"
      width={691}
      height={200}
      className={className ?? "h-11 w-auto"}
    />
  );
}
