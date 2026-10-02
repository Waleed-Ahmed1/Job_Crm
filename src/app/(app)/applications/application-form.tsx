"use client";
import { useActionState } from "react";
import { createApplication, type ApplicationActionState } from "@/app/(app)/applications/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APPLICATION_STAGES } from "@/lib/types";

const initialState: ApplicationActionState = {};
const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
export function ApplicationForm() {
  const [state, action, pending] = useActionState(createApplication, initialState);
  return <form action={action} className="space-y-7"><div className="grid gap-5 sm:grid-cols-2"><Field label="Company" name="company" required placeholder="e.g. Acme" /><Field label="Role" name="role" required placeholder="e.g. Product Designer" /><div className="space-y-2"><Label htmlFor="stage">Stage</Label><select className={selectClass} id="stage" name="stage" defaultValue="Saved">{APPLICATION_STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select></div><div className="space-y-2"><Label htmlFor="priority">Priority</Label><select className={selectClass} id="priority" name="priority" defaultValue="Normal"><option>Low</option><option>Normal</option><option>High</option></select></div><Field label="Location" name="location" placeholder="City or Remote" /><div className="space-y-2"><Label htmlFor="workArrangement">Work arrangement</Label><select className={selectClass} id="workArrangement" name="workArrangement" defaultValue=""><option value="">Not specified</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></div><Field label="Job URL" name="jobUrl" type="url" placeholder="https://…" /><Field label="Source" name="source" placeholder="LinkedIn, referral…" /><Field label="Applied date" name="appliedAt" type="date" /><div className="grid grid-cols-3 gap-2"><Field label="Min salary" name="salaryMin" type="number" /><Field label="Max salary" name="salaryMax" type="number" /><Field label="Currency" name="currency" placeholder="USD" maxLength={3} /></div></div><div className="space-y-2"><Label htmlFor="description">Job description</Label><Textarea id="description" name="description" className="min-h-52" /></div><div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" /></div>{state.error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}<div className="flex justify-end"><Button disabled={pending}>{pending ? "Saving…" : "Save application"}</Button></div></form>;
}
function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>; }
