import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ComposeForm } from "@/app/(app)/email/compose/compose-form";
import { listApplications } from "@/lib/data";
export default async function ComposePage({ searchParams }: { searchParams: Promise<{ application?: string }> }) { const [applications, params] = await Promise.all([listApplications(), searchParams]); return <div className="space-y-7"><PageHeader title="Compose email" description="Generate → review and edit → explicitly send." /><Card><CardHeader><CardTitle>New message</CardTitle></CardHeader><CardContent><ComposeForm applications={applications} initialApplicationId={params.application} /></CardContent></Card></div>; }
