import { Compass } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewer } from "@/lib/auth";

export default async function LoginPage() {
  if (await getViewer()) redirect("/dashboard");
  return <main className="grid min-h-screen place-items-center px-4"><Card className="w-full max-w-md"><CardHeader className="space-y-4"><div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white"><Compass className="size-6" /></div><div><CardTitle className="text-2xl">Welcome to Northstar</CardTitle><CardDescription className="mt-2">Private access only. Public account creation is disabled.</CardDescription></div></CardHeader><CardContent><LoginForm /></CardContent></Card></main>;
}
