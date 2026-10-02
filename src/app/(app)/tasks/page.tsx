import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { completeTask } from "@/app/(app)/tasks/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { listTasks } from "@/lib/data";
import { dueBucket, formatDateTime } from "@/lib/time";
import type { TaskItem } from "@/lib/types";
export default async function TasksPage() { const tasks = await listTasks(); const groups = [{ key: "overdue", label: "Overdue" }, { key: "today", label: "Due today" }, { key: "upcoming", label: "Upcoming" }] as const; return <div className="space-y-7"><PageHeader title="Tasks" description="Follow-ups, interview preparation, and the work that moves applications forward." actions={<Button asChild><Link href="/tasks/new"><Plus />Create task</Link></Button>} /><div className="grid gap-6 xl:grid-cols-3">{groups.map((group) => <TaskGroup key={group.key} title={group.label} tasks={tasks.filter((task) => task.status !== "completed" && dueBucket(task.dueAt) === group.key)} />)}</div><TaskGroup title="Completed" tasks={tasks.filter((task) => task.status === "completed")} completed /></div>; }
function TaskGroup({ title, tasks, completed = false }: { title: string; tasks: TaskItem[]; completed?: boolean }) { return <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>{title}</CardTitle><Badge variant="outline">{tasks.length}</Badge></CardHeader><CardContent className="space-y-3">{tasks.length ? tasks.map((task) => <div key={task.id} className="rounded-xl border bg-white p-4"><p className={completed ? "text-muted-foreground line-through" : "font-medium"}>{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.applicationLabel ?? "General"}</p><div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">{formatDateTime(task.dueAt)}</span>{!completed ? <form action={completeTask.bind(null, task.id)}><Button size="sm" variant="ghost"><Check />Complete</Button></form> : null}</div></div>) : <p className="text-sm text-muted-foreground">No tasks here.</p>}</CardContent></Card>; }
