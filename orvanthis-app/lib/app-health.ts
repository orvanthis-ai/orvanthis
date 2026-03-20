export type HealthStatus = "good" | "warning" | "error";

export type HealthCheckItem = {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
};

export function getEnvHealthChecks(): HealthCheckItem[] {
  return [
    {
      id: "env-nextauth-secret",
      label: "NEXTAUTH_SECRET",
      status: process.env.NEXTAUTH_SECRET ? "good" : "error",
      detail: process.env.NEXTAUTH_SECRET
        ? "NEXTAUTH_SECRET is configured."
        : "NEXTAUTH_SECRET is missing.",
    },
    {
      id: "env-nextauth-url",
      label: "NEXTAUTH_URL",
      status: process.env.NEXTAUTH_URL ? "good" : "warning",
      detail: process.env.NEXTAUTH_URL
        ? `NEXTAUTH_URL is set to ${process.env.NEXTAUTH_URL}.`
        : "NEXTAUTH_URL is missing. Local development may still work, but production should define it.",
    },
    {
      id: "env-openai-key",
      label: "OPENAI_API_KEY",
      status: process.env.OPENAI_API_KEY ? "good" : "error",
      detail: process.env.OPENAI_API_KEY
        ? "OPENAI_API_KEY is configured."
        : "OPENAI_API_KEY is missing.",
    },
    {
      id: "env-database-url",
      label: "DATABASE_URL",
      status: process.env.DATABASE_URL ? "good" : "warning",
      detail: process.env.DATABASE_URL
        ? "DATABASE_URL is configured."
        : "DATABASE_URL is missing from runtime env.",
    },
  ];
}

export function getStaticProductChecks(): HealthCheckItem[] {
  return [
    {
      id: "product-auth-protection",
      label: "Platform auth protection",
      status: "good",
      detail: "Protected platform routes redirect unauthenticated users.",
    },
    {
      id: "product-api-lockdown",
      label: "API access control",
      status: "good",
      detail: "API access now checks auth, plan access, and usage limits on the server.",
    },
    {
      id: "product-premium-gating",
      label: "Premium feature gating",
      status: "good",
      detail: "Premium locks exist in both UI and API logic.",
    },
    {
      id: "product-playwright",
      label: "Core Playwright coverage",
      status: "good",
      detail: "Core test coverage exists for onboarding, calendar, workspace, premium locks, and dev admin.",
    },
    {
      id: "product-stripe-live",
      label: "Live billing readiness",
      status: "warning",
      detail: "Billing architecture exists, but live Stripe setup still needs completion.",
    },
    {
      id: "product-deploy-readiness",
      label: "Deployment readiness",
      status: "warning",
      detail: "App is strong in development, but deployment and production hardening still need completion.",
    },
    {
      id: "product-legal-readiness",
      label: "Business and legal readiness",
      status: "warning",
      detail: "LLC, domain, policy pages, and production payment readiness still need to be finalized.",
    },
  ];
}

export function getAgentChecks(): HealthCheckItem[] {
  return [
    {
      id: "agent-strategy",
      label: "Strategy agent",
      status: "good",
      detail: "Strategy workflows exist through assistant, signals, workspace, and opportunities.",
    },
    {
      id: "agent-execution",
      label: "Execution agent",
      status: "good",
      detail: "Execution planning is available through premium assistant and workspace flows.",
    },
    {
      id: "agent-qa",
      label: "QA agent",
      status: "warning",
      detail: "Playwright coverage exists, but a live in-app QA agent loop is not built yet.",
    },
    {
      id: "agent-operator",
      label: "Operator agent",
      status: "warning",
      detail: "Operator workflows are partially represented by Dev Admin and Prelaunch, but not yet fully agent-driven.",
    },
    {
      id: "agent-code-review",
      label: "Code review agent",
      status: "warning",
      detail: "Code review prompts and internal audit workflows are not yet centralized in-product.",
    },
  ];
}

export function summarizeHealth(items: HealthCheckItem[]) {
  const total = items.length;
  const good = items.filter((item) => item.status === "good").length;
  const warning = items.filter((item) => item.status === "warning").length;
  const error = items.filter((item) => item.status === "error").length;

  return {
    total,
    good,
    warning,
    error,
  };
}