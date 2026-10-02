import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/app/(app)/tasks/task-form";
import { listApplications } from "@/lib/data";
export default async function NewTaskPage() { const applications = await listApplications(); return <div className="mx-auto max-w-3xl space-y-7"><PageHeader title="Create task" description="Follow-ups are reminders only. Northstar never sends them automatically." /><Card><CardHeader><CardTitle>Reminder details</CardTitle></CardHeader><CardContent><TaskForm applications={applications} /></CardContent></Card></div>; }
