import "server-only";
import nodemailer from "nodemailer";

export type MimeAttachment = { filename: string; contentType: string; content: Buffer };
export type MimeInput = { from: string; to: string[]; cc?: string[]; bcc?: string[]; subject: string; bodyText: string; html?: string; inReplyTo?: string; references?: string[]; replyTo?: string; attachments?: MimeAttachment[] };
export async function composeMime(input: MimeInput) {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
  const result = await transport.sendMail({ from: input.from, to: input.to, cc: input.cc, bcc: input.bcc, subject: input.subject, text: input.bodyText, html: input.html, replyTo: input.replyTo, inReplyTo: input.inReplyTo, references: input.references, attachments: input.attachments?.map((item) => ({ filename: item.filename, contentType: item.contentType, content: item.content })) });
  const message = result.message;
  if (!Buffer.isBuffer(message)) throw new Error("MIME composer did not return a buffer");
  return message.toString("base64url");
}