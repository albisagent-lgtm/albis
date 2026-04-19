const SITE = "https://www.albis.news";
const NAVY = "#1a1a2e";
const AMBER = "#c8922a";
const GRAY = "#6b7280";
const BORDER = "#e5e7eb";
const BODY = "#374151";
const WHITE = "#ffffff";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function generateWelcomeEmail(email: string): { subject: string; html: string } {
  const subject = "Welcome to Albis.";
  const unsubscribeUrl = `${SITE}/api/unsubscribe?email=${encodeURIComponent(email)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Welcome to Albis</title>
  <style>
    body,table,td{font-family:Georgia,'Times New Roman',serif;}
    a{color:${NAVY};text-decoration:none;}
    a:hover{text-decoration:underline;}
    @media only screen and (max-width:600px){
      .wrap{padding:28px 20px!important;}
      .masthead{padding:32px 20px 20px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${WHITE};-webkit-font-smoothing:antialiased;">

  <div style="display:none;max-height:0;overflow:hidden;">You're in. Your first briefing arrives tomorrow morning.</div>

  <table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:${WHITE};">

    <tr><td class="masthead" style="padding:40px 40px 0;text-align:center;border-bottom:3px solid ${NAVY};">
      <div style="font-size:38px;font-weight:900;color:${NAVY};letter-spacing:4px;text-transform:uppercase;">ALBIS</div>
      <div style="font-size:11px;color:${GRAY};letter-spacing:2px;margin:4px 0 18px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-transform:uppercase;">Daily Briefing</div>
    </td></tr>

    <tr><td class="wrap" style="padding:40px 40px 32px;">
      <div style="font-size:10px;color:${AMBER};text-transform:uppercase;letter-spacing:2px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-weight:700;margin-bottom:14px;">You're in</div>

      <div style="font-size:26px;font-weight:900;color:${NAVY};line-height:1.25;margin-bottom:20px;">Your first briefing arrives tomorrow morning.</div>

      <p style="font-size:16px;color:${BODY};line-height:1.7;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
        Each morning you'll get a clear, calm read on what's moving in the world — what happened, how different regions are framing it, and what most coverage misses.
      </p>

      <p style="font-size:16px;color:${BODY};line-height:1.7;margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
        No hot takes. No outrage. Just the signal.
      </p>

      <div style="height:1px;background:${BORDER};margin:28px 0;"></div>

      <div style="text-align:center;padding:4px 0 8px;">
        <div style="font-size:13px;color:${GRAY};font-family:-apple-system,BlinkMacSystemFont,sans-serif;">See clearly. — Albis</div>
      </div>
    </td></tr>

    <tr><td style="padding:20px 40px 32px;text-align:center;border-top:3px solid ${NAVY};">
      <div style="font-size:11px;color:#9ca3af;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
        You're receiving this because you signed up at <a href="${SITE}" style="color:#9ca3af;text-decoration:underline;">albis.news</a><br>
        <a href="${esc(unsubscribeUrl)}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
        &nbsp;·&nbsp; Observe. Never judge.
      </div>
    </td></tr>

  </table>

</body>
</html>`;

  return { subject, html };
}
