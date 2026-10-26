#!/usr/bin/env node
// ORV-122 row 21: does a forged client IP header choose the rate limit bucket on staging?
// Not part of `pnpm test`; the QA role runs it by hand after slice B is on staging and puts the
// output in the G4 packet. It sends only to the URL given, with documentation addresses.
//
//   node scripts/probe/forged-ip-headers.mjs https://<staging-host>                        # machine 1
//   node scripts/probe/forged-ip-headers.mjs https://<staging-host> --replay <window end>  # machine 2
//
// Machine 1 waits until 1 s after an aligned 10 s boundary (Unix seconds a multiple of 10) and
// prints that window's end (Unix seconds). It sends 4 POSTs, each with different forged
// x-forwarded-for, x-vercel-forwarded-for and x-real-ip, then a 5th with no forged header.
// Pass: statuses 200, 200, 200, 429, 429 and body code RATE_LIMITED on 4 and 5.
// Machine 2 (another public IP) is given the printed window end and sends one POST with request
// 1's forged values before it. After the window end it refuses to send and the run is void.
// Pass: 200. The probe's 5 requests count toward `sign-in` (10 per 10 minutes), so at most 2
// runs fit in one 10 minute window from one network.

const [base, flag, windowEndArg] = process.argv.slice(2);
if (!base || !/^https?:\/\//.test(base) || (flag && flag !== "--replay")) {
  console.error("usage: forged-ip-headers.mjs <base url> [--replay <window end, Unix seconds>]");
  process.exit(2);
}

const forged = (n) => ({
  "x-forwarded-for": `203.0.113.${n}`,
  "x-vercel-forwarded-for": `198.51.100.${n}`,
  "x-real-ip": `192.0.2.${n}`,
});

async function send(label, extra) {
  const res = await fetch(new URL("/api/auth/sign-in/social", base), {
    method: "POST",
    headers: { "content-type": "application/json", origin: new URL(base).origin, ...extra },
    body: JSON.stringify({ provider: "google", callbackURL: "/account" }),
    redirect: "manual",
  });
  const body = await res.text();
  const code = /"code":\s*"([A-Z_]+)"/.exec(body)?.[1] ?? "";
  console.log(
    JSON.stringify({
      at: new Date().toISOString(),
      request: label,
      status: res.status,
      retryAfter: res.headers.get("retry-after"),
      code,
    }),
  );
  return { status: res.status, code };
}

if (flag === "--replay") {
  const windowEnd = Number(windowEndArg);
  if (!Number.isInteger(windowEnd) || windowEnd % 10 !== 0) {
    console.error("--replay needs the window end machine 1 printed (Unix seconds)");
    process.exit(2);
  }
  if (Date.now() >= windowEnd * 1000) {
    console.log(`VOID: the window ended at ${windowEnd}; nothing sent. Run both machines again.`);
    process.exit(1);
  }
  const { status } = await send("second network, request 1's forged values", forged(1));
  const inWindow = Date.now() < windowEnd * 1000;
  if (!inWindow) {
    console.log(
      `VOID: the answer came after the window end ${windowEnd}. Run both machines again.`,
    );
    process.exit(1);
  }
  console.log(status === 200 ? "PASS: 200" : `FAIL: expected 200, got ${status}`);
  process.exit(status === 200 ? 0 : 1);
}

// Aligned start: 1 s after a multiple of 10 s, so all 5 requests sit in one 10 s window.
const startMs = (Math.floor(Date.now() / 10_000) + 1) * 10_000 + 1000;
const windowEnd = startMs / 1000 - 1 + 10;
console.log(JSON.stringify({ windowEnd, startsAt: new Date(startMs).toISOString() }));
await new Promise((resolve) => setTimeout(resolve, startMs - Date.now()));

const answers = [];
for (const n of [1, 2, 3, 4]) answers.push(await send(`forged ${n}`, forged(n)));
answers.push(await send("no forged header", {}));
const late = Date.now() >= windowEnd * 1000;
const statuses = answers.map((a) => a.status);
const pass =
  !late &&
  statuses.join() === "200,200,200,429,429" &&
  answers[3].code === "RATE_LIMITED" &&
  answers[4].code === "RATE_LIMITED";
console.log(
  late
    ? `VOID: the requests ran past the window end ${windowEnd}`
    : pass
      ? `PASS: statuses 200,200,200,429,429; replay from the second network before ${windowEnd}`
      : `FAIL: statuses ${statuses.join(",")}, codes ${answers.map((a) => a.code || "-").join(",")}; a forged header may choose the bucket, slice B does not pass G4`,
);
process.exit(pass ? 0 : 1);
