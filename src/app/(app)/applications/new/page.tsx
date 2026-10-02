import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApplicationForm } from "@/app/(app)/applications/application-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
export default function NewApplicationPage() { return <div className="mx-auto max-w-4xl space-y-7"><PageHeader title="Add application" description="Capture the opportunity now; add contacts and conversations later." actions={<Button variant="ghost" asChild><Link href="/applications"><ArrowLeft />Back</Link></Button>} /><Card><CardHeader><CardTitle>Opportunity details</CardTitle></CardHeader><CardContent><ApplicationForm /></CardContent></Card></div>; }
