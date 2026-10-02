import { z } from "zod";
import { APPLICATION_STAGES } from "@/lib/types";

export const applicationSchema = z.object({
  company: z.string().trim().min(1).max(160), role: z.string().trim().min(1).max(200), stage: z.enum(APPLICATION_STAGES),
  jobUrl: z.union([z.url(), z.literal("")]).optional(), location: z.string().trim().max(160).optional(),
  workArrangement: z.enum(["Remote", "Hybrid", "On-site"]).optional(), source: z.string().trim().max(100).optional(),
  priority: z.enum(["Low", "Normal", "High"]), description: z.string().trim().max(50000).optional(), notes: z.string().trim().max(30000).optional(),
  appliedAt: z.string().optional(), salaryMin: z.coerce.number().nonnegative().optional(), salaryMax: z.coerce.number().nonnegative().optional(), currency: z.string().trim().length(3).optional(),
}).refine((value) => !value.salaryMin || !value.salaryMax || value.salaryMin <= value.salaryMax, { message: "Minimum salary must not exceed maximum salary.", path: ["salaryMax"] });

export const taskSchema = z.object({ title: z.string().trim().min(1).max(240), dueAt: z.iso.datetime(), kind: z.enum(["follow_up", "interview_prep", "general"]), applicationId: z.uuid().nullable().optional() });
