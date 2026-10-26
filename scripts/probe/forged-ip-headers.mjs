#!/usr/bin/env node
// ORV-122 row 21: does a forged client IP header choose the rate limit bucket on staging?
// Not part of `pnpm test`; the QA role runs it by hand after slice B is on staging and puts the
// output in the G4 packet. It sends only to the URL given, with documentation addresses.
//
//   node scripts/probe/forged-ip-headers.mjs https://<staging-host>            # machine 1
//   node scripts/probe/forged-ip-headers.mjs https://<staging-host> --replay   # machine 2
//
// Machine 1: 4 POSTs in one 10 s window, each with different forged x-forwarded-for,
// x-vercel-forwarded-for and x-real-ip, then a 5th with no forged header. Pass: requests 4 and 5
// answer 429. Machine 2 (another public IP): one POST with request 1's forged values. Pass: 200.

const [base, flag] = process.argv.slice(2);
if (!base || !/^https?:\/\//.test(base)) {
  console.error("usage: forged-ip-headers.mjs <base url> [--replay]");
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
  const code = /"code":"([A-Z_]+)"/.exec(body)?.[1] ?? "";
  console.log(
    JSON.stringify({
      at: new Date().toISOString(),
      request: label,
      status: res.status,
      retryAfter: res.headers.get("retry-after"),
      code,
    }),
  );
  return res.status;
}

if (flag === "--replay") {
  const status = await send("second network, request 1's forged values", forged(1));
  console.log(status === 200 ? "PASS: 200" : `FAIL: expected 200, got ${status}`);
  process.exit(status === 200 ? 0 : 1);
}

const statuses = [];
for (const n of [1, 2, 3, 4]) statuses.push(await send(`forged ${n}`, forged(n)));
statuses.push(await send("no forged header", {}));
const pass = statuses[3] === 429 && statuses[4] === 429;
console.log(
  pass
    ? "PASS: requests 4 and 5 answered 429, so no forged value picked a bucket"
    : `FAIL: statuses ${statuses.join(", ")}; a forged header may choose the bucket, slice B does not pass G4`,
);
process.exit(pass ? 0 : 1);
