export type AgentMemory = {
  completedTaskIds: string[];
  lastUpdated: number;
};

const STORAGE_KEY = "orvanthis:agentMemory:v1";

export function loadAgentMemory(): AgentMemory {
  if (typeof window === "undefined") {
    return { completedTaskIds: [], lastUpdated: Date.now() };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { completedTaskIds: [], lastUpdated: Date.now() };
    }

    const parsed = JSON.parse(raw);

    return {
      completedTaskIds: Array.isArray(parsed.completedTaskIds)
        ? parsed.completedTaskIds.filter(
            (item: unknown): item is string => typeof item === "string"
          )
        : [],
      lastUpdated:
        typeof parsed.lastUpdated === "number"
          ? parsed.lastUpdated
          : Date.now(),
    };
  } catch {
    return { completedTaskIds: [], lastUpdated: Date.now() };
  }
}

export function saveAgentMemory(memory: AgentMemory) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // ignore
  }
}

export function markTaskComplete(taskId: string) {
  const memory = loadAgentMemory();

  if (!memory.completedTaskIds.includes(taskId)) {
    memory.completedTaskIds.push(taskId);
  }

  memory.lastUpdated = Date.now();
  saveAgentMemory(memory);
}

export function resetAgentMemory() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}