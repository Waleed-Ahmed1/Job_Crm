import { z } from "zod";
export const cvSchema = z.object({
  title: z.string().trim().min(1, "Enter a CV name.").max(100),
  body_text: z.string().trim().min(1, "Enter your CV text.").max(50000, "CV text must be 50,000 characters or less.")
});
export type EditableCv = { id: string; title: string; body_text: string; updated_at: string };
