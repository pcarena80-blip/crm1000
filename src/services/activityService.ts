import { nanoid } from "nanoid";

export type ActivityType =
  | "message"
  | "call"
  | "file"
  | "user"
  | "system"
  | "project"
  | "support"
  | "payment";

export type ActivityPriority = "low" | "medium" | "high" | "urgent";
export type ActivityStatus = "pending" | "completed" | "failed" | "in-progress";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string; // ISO string for safe (de)serialization
  priority: ActivityPriority;
  status: ActivityStatus;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  metadata?: Record<string, unknown>;
  isRead: boolean;
}

type Subscriber = (activities: ActivityItem[]) => void;

const STORAGE_KEY = "activity_log_v1";

class ActivityService {
  private activities: ActivityItem[] = [];
  private subscribers: Set<Subscriber> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ActivityItem[];
        this.activities = parsed;
      }
    } catch {
      // ignore storage errors
      this.activities = [];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.activities));
    } catch {
      // ignore storage errors
    }
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    // initial push
    cb(this.activities);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notify() {
    const snapshot = [...this.activities];
    this.subscribers.forEach((cb) => cb(snapshot));
  }

  log(params: Omit<ActivityItem, "id" | "timestamp" | "isRead"> & {
    timestamp?: string | Date;
    isRead?: boolean;
  }) {
    const item: ActivityItem = {
      id: nanoid(),
      type: params.type,
      title: params.title,
      description: params.description,
      timestamp:
        params.timestamp instanceof Date
          ? params.timestamp.toISOString()
          : params.timestamp || new Date().toISOString(),
      priority: params.priority ?? "medium",
      status: params.status ?? "completed",
      user: params.user,
      metadata: params.metadata,
      isRead: params.isRead ?? false,
    };
    this.activities = [item, ...this.activities].slice(0, 5000);
    this.persist();
    this.notify();
    return item.id;
  }

  markAllRead() {
    this.activities = this.activities.map((a) => ({ ...a, isRead: true }));
    this.persist();
    this.notify();
  }

  exportCSV(): string {
    const header = [
      "id",
      "type",
      "title",
      "description",
      "timestamp",
      "priority",
      "status",
      "userId",
      "userName",
      "userRole",
    ];
    const rows = this.activities.map((a) => [
      a.id,
      a.type,
      escapeCSV(a.title),
      escapeCSV(a.description),
      a.timestamp,
      a.priority,
      a.status,
      a.user?.id ?? "",
      a.user?.name ?? "",
      a.user?.role ?? "",
    ]);
    return [header, ...rows].map((r) => r.join(",")).join("\n");
  }
}

function escapeCSV(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export const activityService = new ActivityService();


