import type { ApplicationListItem, EmailThreadListItem, TaskItem } from "@/lib/types";

export const DEMO_APPLICATIONS: ApplicationListItem[] = [
  { id: "demo-1", role: "Senior Product Designer", company: "Atlas Labs", stage: "Interview", location: "Remote", workArrangement: "Remote", appliedAt: "2026-09-19T09:00:00Z", savedAt: "2026-09-17T09:00:00Z", priority: "High", tags: ["B2B", "Design systems"], nextAction: "Prepare portfolio walkthrough", nextActionAt: "2026-10-02T06:00:00Z", contactName: "Maya Chen" },
  { id: "demo-2", role: "Product Designer", company: "Northwind", stage: "Applied", location: "Lahore", workArrangement: "Hybrid", appliedAt: "2026-09-28T11:30:00Z", savedAt: "2026-09-26T08:00:00Z", priority: "Normal", tags: ["Fintech"], nextAction: "Follow up", nextActionAt: "2026-10-05T06:00:00Z", contactName: null },
  { id: "demo-3", role: "UX Lead", company: "Ember Health", stage: "Screening", location: "Karachi", workArrangement: "Hybrid", appliedAt: "2026-09-24T07:00:00Z", savedAt: "2026-09-22T10:00:00Z", priority: "High", tags: ["Healthtech", "Leadership"], nextAction: "Reply with availability", nextActionAt: "2026-10-01T08:00:00Z", contactName: "Aisha Rahman" },
  { id: "demo-4", role: "Staff Product Designer", company: "Paperplane", stage: "Saved", location: "Remote", workArrangement: "Remote", appliedAt: null, savedAt: "2026-09-30T15:00:00Z", priority: "Normal", tags: ["SaaS"], nextAction: "Tailor resume", nextActionAt: "2026-10-03T06:00:00Z", contactName: null },
  { id: "demo-5", role: "Design Manager", company: "Keystone", stage: "Rejected", location: "Dubai", workArrangement: "On-site", appliedAt: "2026-08-12T08:00:00Z", savedAt: "2026-08-10T08:00:00Z", priority: "Low", tags: ["Management"], nextAction: null, nextActionAt: null, contactName: "Omar Aziz" },
];
export const DEMO_TASKS: TaskItem[] = [
  { id: "task-1", title: "Reply with interview availability", dueAt: "2026-10-01T08:00:00Z", status: "pending", kind: "follow_up", applicationId: "demo-3", applicationLabel: "UX Lead · Ember Health" },
  { id: "task-2", title: "Prepare portfolio walkthrough", dueAt: "2026-10-02T06:00:00Z", status: "pending", kind: "interview_prep", applicationId: "demo-1", applicationLabel: "Senior Product Designer · Atlas Labs" },
  { id: "task-3", title: "Follow up after application", dueAt: "2026-09-30T06:00:00Z", status: "needs_review", kind: "follow_up", applicationId: "demo-2", applicationLabel: "Product Designer · Northwind" },
];
export const DEMO_THREADS: EmailThreadListItem[] = [
  { id: "thread-1", providerThreadId: "demo-provider-1", subject: "Next steps — UX Lead", snippet: "Thanks for taking the time to speak with us. Could you share your availability…", participants: ["Aisha Rahman", "you@example.com"], lastMessageAt: "2026-10-01T03:45:00Z", unread: true, applicationLabel: "UX Lead · Ember Health" },
  { id: "thread-2", providerThreadId: "demo-provider-2", subject: "Portfolio interview details", snippet: "Your portfolio conversation is confirmed for Friday…", participants: ["Maya Chen", "you@example.com"], lastMessageAt: "2026-09-30T12:20:00Z", unread: false, applicationLabel: "Senior Product Designer · Atlas Labs" },
];
