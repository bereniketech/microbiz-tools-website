import { Resend } from "resend";

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "noreply@microbiztools.com";

let _resend: Resend | null = null;

export const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop) {
    if (!_resend) {
      const key = process.env.RESEND_API_KEY;
      if (!key) throw new Error("RESEND_API_KEY is not set");
      _resend = new Resend(key);
    }
    return (_resend as unknown as Record<string | symbol, unknown>)[prop];
  },
});
