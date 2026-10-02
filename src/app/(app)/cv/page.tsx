import { PageHeader } from "@/components/page-header";
import { CvEditor } from "@/components/cv-editor";
import { requireViewer } from "@/lib/auth";
export default async function CvPage() {
  const viewer = await requireViewer();
  return <div className="space-y-7"><PageHeader title="My CVs" description="Upload a plain-text CV, edit it, and download a simple PDF." /><CvEditor disabled={viewer.demo} /></div>;
}
