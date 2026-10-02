import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// 1x1 transparent GIF
const PIXEL = new Uint8Array(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (/^[A-Za-z0-9_-]{20,64}$/.test(token)) {
    try {
      await createSupabaseAdminClient().rpc("record_mail_open", { p_token: token });
    } catch {
      /* Never break the image response because of a tracking failure. */
    }
  }
  return new Response(PIXEL, {
    headers: {
      "content-type": "image/gif",
      "content-length": String(PIXEL.length),
      "cache-control": "no-store, no-cache, must-revalidate, private",
    },
  });
}