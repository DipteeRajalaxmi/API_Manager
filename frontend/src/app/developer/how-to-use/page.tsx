"use client";
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";

type Section = "quickstart" | "authenticate" | "requests" | "errors" | "ratelimits" | "tips";

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function HowToUsePage() {
  const [activeSection, setActiveSection] = useState<Section>("quickstart");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copy(text, id)}
      className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg
        bg-white/10 hover:bg-white/20 text-white/80 hover:text-white
        border border-white/20 transition-all">
      {copiedKey === id ? "✓ Copied" : "Copy"}
    </button>
  );

  const CodeBlock = ({ code, id, lang = "bash" }: { code: string; id: string; lang?: string }) => (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{lang}</span>
        <CopyButton text={code} id={id} />
      </div>
      <pre className="px-4 py-4 text-sm font-mono text-gray-100 overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );

  const sections = [
    { key: "quickstart",   icon: "🚀", label: "Quick Start"        },
    { key: "authenticate", icon: "🔑", label: "Authentication"      },
    { key: "requests",     icon: "📡", label: "Making Requests"     },
    { key: "errors",       icon: "⚠️", label: "Error Responses"    },
    { key: "ratelimits",   icon: "⏱",  label: "Rate Limits"        },
    { key: "tips",         icon: "💡", label: "Tips & Best Practices"},
  ];

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in max-w-6xl">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500
              flex items-center justify-center text-white text-xl shadow-md">
              📖
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">How to Use the API Manager</h1>
              <p className="text-gray-400 text-sm">Everything you need to start making API calls</p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">

          {/* ── Sidebar Nav ────────────────────────────────────────────── */}
          <div className="w-52 flex-shrink-0">
            <div className="card p-2 sticky top-6">
              {sections.map(s => (
                <button key={s.key} onClick={() => setActiveSection(s.key as Section)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                    text-sm font-semibold transition-all text-left
                    ${activeSection === s.key
                      ? "bg-teal-50 text-teal-600"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content ────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* ── QUICK START ── */}
            {activeSection === "quickstart" && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800 mb-1">Quick Start</h2>
                  <p className="text-gray-400 text-sm">Get up and running in 3 steps.</p>
                </div>

                {/* Step cards */}
                {[
                  {
                    step: "01",
                    title: "Create an Application",
                    desc: "An application represents your project (mobile app, web app, script). You need one before subscribing to any API.",
                    action: "Create App →",
                    href: "/developer/apps",
                    color: "teal",
                  },
                  {
                    step: "02",
                    title: "Subscribe to an API",
                    desc: "Browse the marketplace, find the API you need, and subscribe using your application. You'll get an API key immediately.",
                    action: "Browse Marketplace →",
                    href: "/marketplace",
                    color: "blue",
                  },
                  {
                    step: "03",
                    title: "Save Your API Key",
                    desc: "Your API key is shown ONCE after subscribing. Copy and save it securely — you cannot see it again (but you can regenerate it).",
                    action: "View My Apps →",
                    href: "/developer/apps",
                    color: "purple",
                  },
                ].map(step => (
                  <div key={step.step} className="card p-5 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                      font-extrabold text-sm flex-shrink-0
                      ${step.color === "teal"   ? "bg-teal-100 text-teal-600"   :
                        step.color === "blue"   ? "bg-blue-100 text-blue-600"   :
                                                  "bg-purple-100 text-purple-600"}`}>
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-sm mb-1">{step.title}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-3">{step.desc}</p>
                      <Link href={step.href}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg inline-block
                          ${step.color === "teal"   ? "bg-teal-50 text-teal-600 hover:bg-teal-100"   :
                            step.color === "blue"   ? "bg-blue-50 text-blue-600 hover:bg-blue-100"   :
                                                      "bg-purple-50 text-purple-600 hover:bg-purple-100"}
                          transition-colors`}>
                        {step.action}
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Gateway URL */}
                <div className="bg-gray-900 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Gateway Base URL
                  </p>
                  <div className="flex items-center gap-3">
                    <code className="text-teal-400 font-mono text-sm flex-1 break-all">
                      {GATEWAY_URL}/gateway/
                    </code>
                    <CopyButton text={`${GATEWAY_URL}/gateway/`} id="gateway-url" />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    All API calls go through this gateway URL. Append the endpoint path after it.
                  </p>
                </div>

                {/* First call example */}
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-3">Your first API call:</p>
                  <CodeBlock
                    id="first-call"
                    code={`curl -X GET "${GATEWAY_URL}/gateway/posts" \\
  -H "X-API-Key: am_your_api_key_here"`} />
                </div>
              </div>
            )}

            {/* ── AUTHENTICATION ── */}
            {activeSection === "authenticate" && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800 mb-1">Authentication</h2>
                  <p className="text-gray-400 text-sm">3 ways to pass your API key. Use Method 1 for best security.</p>
                </div>

                {[
                  {
                    method: "Method 1",
                    label: "X-API-Key Header",
                    badge: "Recommended",
                    badgeColor: "teal",
                    desc: "Pass your API key in the X-API-Key request header.",
                    code: `curl -X GET "${GATEWAY_URL}/gateway/posts/1" \\
  -H "X-API-Key: am_your_api_key_here"`,
                    id: "auth-1",
                  },
                  {
                    method: "Method 2",
                    label: "Authorization Bearer",
                    badge: "Standard",
                    badgeColor: "blue",
                    desc: "Pass your API key as a Bearer token in the Authorization header.",
                    code: `curl -X GET "${GATEWAY_URL}/gateway/posts/1" \\
  -H "Authorization: Bearer am_your_api_key_here"`,
                    id: "auth-2",
                  },
                  {
                    method: "Method 3",
                    label: "Query Parameter",
                    badge: "Least Secure",
                    badgeColor: "orange",
                    desc: "Pass your API key as a query parameter. Avoid in production as keys appear in logs.",
                    code: `curl -X GET "${GATEWAY_URL}/gateway/posts/1?api_key=am_your_api_key_here"`,
                    id: "auth-3",
                  },
                ].map(m => (
                  <div key={m.id} className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-gray-400">{m.method}</span>
                      <h3 className="font-bold text-gray-800 text-sm">{m.label}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${m.badgeColor === "teal"   ? "bg-teal-50 text-teal-600"     :
                          m.badgeColor === "blue"   ? "bg-blue-50 text-blue-600"     :
                                                      "bg-orange-50 text-orange-500"}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mb-3">{m.desc}</p>
                    <CodeBlock code={m.code} id={m.id} />
                  </div>
                ))}

                {/* API key format */}
                <div className="card p-5">
                  <h3 className="font-bold text-gray-800 text-sm mb-3">API Key Format</h3>
                  <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm">
                    <span className="text-teal-600 font-bold">am_</span>
                    <span className="text-gray-500">xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {[
                      { label: "Prefix", value: "am_", desc: "Always starts with am_" },
                      { label: "Length", value: "~46 chars", desc: "Random URL-safe base64" },
                      { label: "Case sensitive", value: "Yes", desc: "Copy exactly as shown" },
                      { label: "Where to find", value: "My Apps page", desc: "Shown once on subscribe" },
                    ].map(info => (
                      <div key={info.label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">{info.label}</p>
                        <p className="text-sm font-bold text-gray-700">{info.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{info.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── MAKING REQUESTS ── */}
            {activeSection === "requests" && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800 mb-1">Making Requests</h2>
                  <p className="text-gray-400 text-sm">How to construct gateway URLs and call different endpoints.</p>
                </div>

                {/* URL Construction */}
                <div className="card p-5">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">URL Construction</h3>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Formula</p>
                    <div className="flex items-center gap-1 flex-wrap font-mono text-sm">
                      <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-lg">Gateway URL</span>
                      <span className="text-gray-400">+</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">Endpoint Path</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">Example</p>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex gap-2">
                        <span className="text-gray-400 w-40 flex-shrink-0">Gateway URL:</span>
                        <span className="text-teal-600">{GATEWAY_URL}/gateway/</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-400 w-40 flex-shrink-0">Endpoint path:</span>
                        <span className="text-blue-600">posts/1</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex gap-2">
                        <span className="text-gray-400 w-40 flex-shrink-0">Final URL:</span>
                        <span className="text-gray-800 font-bold">{GATEWAY_URL}/gateway/posts/1</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Examples by method */}
                {[
                  {
                    method: "GET",
                    color: "teal",
                    title: "GET Request — Fetch data",
                    examples: [
                      {
                        desc: "Get all posts",
                        code: `curl -X GET "${GATEWAY_URL}/gateway/posts" \\
  -H "X-API-Key: am_your_key"`,
                        id: "get-1",
                      },
                      {
                        desc: "Get post by ID",
                        code: `curl -X GET "${GATEWAY_URL}/gateway/posts/1" \\
  -H "X-API-Key: am_your_key"`,
                        id: "get-2",
                      },
                      {
                        desc: "With query parameters",
                        code: `curl -X GET "${GATEWAY_URL}/gateway/posts?userId=1&limit=10" \\
  -H "X-API-Key: am_your_key"`,
                        id: "get-3",
                      },
                    ],
                  },
                  {
                    method: "POST",
                    color: "green",
                    title: "POST Request — Create data",
                    examples: [
                      {
                        desc: "Create a new resource",
                        code: `curl -X POST "${GATEWAY_URL}/gateway/posts" \\
  -H "X-API-Key: am_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My Post",
    "body": "Hello World",
    "userId": 1
  }'`,
                        id: "post-1",
                      },
                    ],
                  },
                  {
                    method: "PUT",
                    color: "blue",
                    title: "PUT Request — Update data",
                    examples: [
                      {
                        desc: "Update a resource",
                        code: `curl -X PUT "${GATEWAY_URL}/gateway/posts/1" \\
  -H "X-API-Key: am_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Updated Title", "body": "Updated body"}'`,
                        id: "put-1",
                      },
                    ],
                  },
                  {
                    method: "DELETE",
                    color: "red",
                    title: "DELETE Request — Remove data",
                    examples: [
                      {
                        desc: "Delete a resource",
                        code: `curl -X DELETE "${GATEWAY_URL}/gateway/posts/1" \\
  -H "X-API-Key: am_your_key"`,
                        id: "delete-1",
                      },
                    ],
                  },
                ].map(section => (
                  <div key={section.method} className="card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg
                        ${section.color === "teal"  ? "bg-teal-100 text-teal-700"   :
                          section.color === "green" ? "bg-green-100 text-green-700" :
                          section.color === "blue"  ? "bg-blue-100 text-blue-700"   :
                                                      "bg-red-100 text-red-600"}`}>
                        {section.method}
                      </span>
                      <h3 className="font-bold text-gray-800 text-sm">{section.title}</h3>
                    </div>
                    <div className="space-y-4">
                      {section.examples.map(ex => (
                        <div key={ex.id}>
                          <p className="text-xs text-gray-400 mb-2">{ex.desc}</p>
                          <CodeBlock code={ex.code} id={ex.id} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Headers injected by gateway */}
                <div className="card p-5">
                  <h3 className="font-bold text-gray-800 text-sm mb-3">
                    Headers Injected by Gateway
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    The gateway automatically adds these headers to every request forwarded to the provider backend:
                  </p>
                  <div className="space-y-2">
                    {[
                      { header: "X-Developer-Id",    value: "123",           desc: "Your user ID" },
                      { header: "X-Developer-Name",  value: "John Dev",      desc: "Your name" },
                      { header: "X-App-Name",        value: "My Mobile App", desc: "Your app name" },
                      { header: "X-Subscription-Id", value: "45",            desc: "Subscription ID" },
                      { header: "X-Organization-Id", value: "7",             desc: "Org ID" },
                      { header: "X-Forwarded-For",   value: "1.2.3.4",       desc: "Your IP address" },
                    ].map(h => (
                      <div key={h.header} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <code className="text-xs font-mono text-teal-600 w-48 flex-shrink-0">{h.header}</code>
                        <code className="text-xs font-mono text-gray-500 w-32 flex-shrink-0">{h.value}</code>
                        <span className="text-xs text-gray-400">{h.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ERROR RESPONSES ── */}
            {activeSection === "errors" && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800 mb-1">Error Responses</h2>
                  <p className="text-gray-400 text-sm">What each error means and how to fix it.</p>
                </div>

                {[
                  {
                    code: "401",
                    color: "orange",
                    title: "Unauthorized",
                    errors: [
                      { msg: "Missing API key",                fix: "Add X-API-Key header to your request" },
                      { msg: "Invalid API key",                fix: "Check your key is correct — no extra spaces" },
                      { msg: "API key is revoked or expired",  fix: "Regenerate your key from My Apps page" },
                      { msg: "Subscription is blocked",        fix: "Contact your API provider" },
                      { msg: "Subscription is cancelled",      fix: "Re-subscribe to the API" },
                    ],
                    example: `{
  "error": "Invalid API key"
}`,
                    id: "err-401",
                  },
                  {
                    code: "403",
                    color: "red",
                    title: "Forbidden",
                    errors: [
                      { msg: "Endpoint access denied", fix: "Your subscription only allows specific endpoints. Contact provider for access." },
                      { msg: "IP blocked",             fix: "Your IP has been blocked by the provider" },
                    ],
                    example: `{
  "error": "Endpoint access denied",
  "reason": "You do not have access to this endpoint",
  "code": 403
}`,
                    id: "err-403",
                  },
                  {
                    code: "429",
                    color: "yellow",
                    title: "Too Many Requests",
                    errors: [
                      { msg: "Rate limit exceeded: PER_MINUTE",        fix: "Wait 60 seconds then retry" },
                      { msg: "Rate limit exceeded: PER_HOUR",          fix: "Wait until next hour" },
                      { msg: "Rate limit exceeded: PER_DAY",           fix: "Wait until next day" },
                      { msg: "Rate limit exceeded: TOTAL",             fix: "You've hit lifetime limit — contact provider" },
                      { msg: "Rate limit exceeded: ENDPOINT_PER_MINUTE", fix: "This endpoint has a stricter limit — wait 60s" },
                    ],
                    example: `{
  "error": "Rate limit exceeded",
  "limitType": "PER_MINUTE",
  "limit": 60,
  "remaining": 0,
  "retryAfterSeconds": 60
}`,
                    id: "err-429",
                    extra: "Check Retry-After response header for exact wait time.",
                  },
                  {
                    code: "503",
                    color: "purple",
                    title: "Service Unavailable",
                    errors: [
                      { msg: "API is temporarily unavailable", fix: "Provider has blocked this API — check reason field" },
                      { msg: "Endpoint is temporarily unavailable", fix: "Provider has blocked this endpoint — try later" },
                      { msg: "Circuit breaker open", fix: "Provider backend is down — retry after 30 seconds" },
                    ],
                    example: `{
  "error": "API is temporarily unavailable",
  "reason": "Under maintenance until 6pm IST",
  "code": 503
}`,
                    id: "err-503",
                  },
                  {
                    code: "502",
                    color: "gray",
                    title: "Bad Gateway",
                    errors: [
                      { msg: "Upstream service error", fix: "Provider backend returned an error or is down — retry later" },
                    ],
                    example: `{
  "error": "Upstream service error: Connection refused"
}`,
                    id: "err-502",
                  },
                  {
                    code: "413",
                    color: "gray",
                    title: "Payload Too Large",
                    errors: [
                      { msg: "Request too large", fix: "Your request body exceeds 10MB limit" },
                    ],
                    example: `{
  "error": "Request too large",
  "maxSizeBytes": 10485760,
  "receivedBytes": 15000000
}`,
                    id: "err-413",
                  },
                ].map(e => (
                  <div key={e.code} className="card p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-lg font-extrabold px-3 py-1 rounded-xl
                        ${e.color === "orange" ? "bg-orange-50 text-orange-500" :
                          e.color === "red"    ? "bg-red-50 text-red-500"       :
                          e.color === "yellow" ? "bg-amber-50 text-amber-600"   :
                          e.color === "purple" ? "bg-purple-50 text-purple-600" :
                                                 "bg-gray-100 text-gray-500"}`}>
                        {e.code}
                      </span>
                      <h3 className="font-bold text-gray-800">{e.title}</h3>
                    </div>

                    {/* Error messages + fixes */}
                    <div className="space-y-2 mb-4">
                      {e.errors.map((err, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-start gap-2">
                            <span className="text-red-400 flex-shrink-0 mt-0.5">✕</span>
                            <div>
                              <code className="text-xs font-mono text-gray-700">{err.msg}</code>
                              <p className="text-xs text-gray-400 mt-1">→ {err.fix}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {e.extra && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 mb-4">
                        💡 {e.extra}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mb-2 font-semibold">Response body:</p>
                    <CodeBlock code={e.example} id={e.id} lang="json" />
                  </div>
                ))}
              </div>
            )}

            {/* ── RATE LIMITS ── */}
            {activeSection === "ratelimits" && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800 mb-1">Rate Limits</h2>
                  <p className="text-gray-400 text-sm">Understanding and handling rate limits.</p>
                </div>

                {/* How limits work */}
                <div className="card p-5">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">How Rate Limits Work</h3>
                  <div className="space-y-3">
                    {[
                      { level: "Endpoint Level", desc: "Checked FIRST. Specific limits per route (e.g. POST /orders: 5/min)", color: "purple", icon: "⚡" },
                      { level: "API Level",       desc: "Checked SECOND. Overall cap for all calls to this API",              color: "teal",   icon: "🌐" },
                    ].map(l => (
                      <div key={l.level} className={`rounded-xl p-4 border
                        ${l.color === "purple" ? "bg-purple-50 border-purple-100" : "bg-teal-50 border-teal-100"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{l.icon}</span>
                          <p className={`text-xs font-bold
                            ${l.color === "purple" ? "text-purple-700" : "text-teal-700"}`}>
                            {l.level}
                          </p>
                        </div>
                        <p className={`text-xs
                          ${l.color === "purple" ? "text-purple-600" : "text-teal-600"}`}>
                          {l.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Both limits must pass for a request to succeed. If either is exceeded → 429 Too Many Requests.
                  </p>
                </div>

                {/* Response headers */}
                <div className="card p-5">
                  <h3 className="font-bold text-gray-800 text-sm mb-3">Rate Limit Response Headers</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Every response includes these headers so you can track your usage:
                  </p>
                  <div className="space-y-1">
                    {[
                      { header: "X-RateLimit-Limit-Minute",              value: "60",  desc: "API: max calls per minute"           },
                      { header: "X-RateLimit-Remaining-Minute",          value: "57",  desc: "API: remaining this minute"          },
                      { header: "X-RateLimit-Limit-Hour",                value: "1000",desc: "API: max calls per hour"             },
                      { header: "X-RateLimit-Remaining-Hour",            value: "986", desc: "API: remaining this hour"            },
                      { header: "X-RateLimit-Limit-Day",                 value: "10000",desc: "API: max calls per day"            },
                      { header: "X-RateLimit-Remaining-Day",             value: "9950",desc: "API: remaining today"               },
                      { header: "X-RateLimit-Endpoint-Limit-Minute",     value: "10",  desc: "Endpoint: max per minute (if set)"  },
                      { header: "X-RateLimit-Endpoint-Remaining-Minute", value: "8",   desc: "Endpoint: remaining this minute"    },
                    ].map(h => (
                      <div key={h.header} className="grid grid-cols-12 gap-2 py-2 border-b border-gray-50 last:border-0 items-center">
                        <code className="col-span-5 text-xs font-mono text-teal-600 truncate">{h.header}</code>
                        <code className="col-span-1 text-xs font-mono text-gray-500">{h.value}</code>
                        <span className="col-span-6 text-xs text-gray-400">{h.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Handle 429 */}
                <div className="card p-5">
                  <h3 className="font-bold text-gray-800 text-sm mb-3">Handling 429 in Code</h3>
                  <CodeBlock id="handle-429" lang="javascript" code={`async function callApi(endpoint) {
  const response = await fetch(
    \`${GATEWAY_URL}/gateway/\${endpoint}\`,
    { headers: { "X-API-Key": "am_your_key" } }
  );

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After") || "60";
    const waitMs = parseInt(retryAfter) * 1000;
    
    console.log(\`Rate limited. Retrying after \${retryAfter}s...\`);
    await new Promise(resolve => setTimeout(resolve, waitMs));
    
    return callApi(endpoint); // retry once
  }

  return response.json();
}`} />
                </div>
              </div>
            )}

            {/* ── TIPS ── */}
            {activeSection === "tips" && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800 mb-1">Tips & Best Practices</h2>
                  <p className="text-gray-400 text-sm">Make the most of the API Manager.</p>
                </div>

                {[
                  {
                    icon: "🔐",
                    title: "Keep your API key secure",
                    color: "red",
                    tips: [
                      "Never hardcode API keys in your frontend code",
                      "Store keys in environment variables (.env files)",
                      "Never commit keys to GitHub — add .env to .gitignore",
                      "If key is compromised → regenerate immediately from My Apps",
                      "Use server-side code to make API calls when possible",
                    ],
                  },
                  {
                    icon: "⏱",
                    title: "Respect rate limits",
                    color: "orange",
                    tips: [
                      "Check X-RateLimit-Remaining-* headers before each call",
                      "Implement exponential backoff on 429 responses",
                      "Cache responses when data doesn't change frequently",
                      "Batch requests where the API supports it",
                      "Monitor your usage in Analytics dashboard",
                    ],
                  },
                  {
                    icon: "🔄",
                    title: "Handle errors gracefully",
                    color: "blue",
                    tips: [
                      "Always check HTTP status code before parsing response",
                      "On 503 → show maintenance message to your users",
                      "On 502 → retry after a short delay (30-60 seconds)",
                      "On 401 → check if key expired and redirect to settings",
                      "Log errors with request details for debugging",
                    ],
                  },
                  {
                    icon: "📊",
                    title: "Monitor your usage",
                    color: "teal",
                    tips: [
                      "Check Analytics page regularly to see usage trends",
                      "Set up alerts if you're approaching limits (coming soon)",
                      "Review which endpoints you use most",
                      "Contact provider if you need higher limits",
                    ],
                  },
                  {
                    icon: "🛠",
                    title: "Development tips",
                    color: "purple",
                    tips: [
                      "Use separate apps for dev/staging/production environments",
                      "Test with Swagger UI at /swagger-ui.html",
                      "Use curl or Postman to test before coding",
                      "Check the API documentation tab for endpoint schemas",
                      "Use the ?api_key= param only for quick testing — not in production",
                    ],
                  },
                ].map(section => (
                  <div key={section.title} className="card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">{section.icon}</span>
                      <h3 className="font-bold text-gray-800 text-sm">{section.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {section.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className={`mt-0.5 flex-shrink-0 font-bold
                            ${section.color === "red"    ? "text-red-400"    :
                              section.color === "orange" ? "text-orange-400" :
                              section.color === "blue"   ? "text-blue-400"   :
                              section.color === "teal"   ? "text-teal-400"   :
                                                           "text-purple-400"}`}>✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Quick reference */}
                <div className="bg-gray-900 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    Quick Reference Card
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    {[
                      { label: "Gateway URL",   value: `${GATEWAY_URL}/gateway/` },
                      { label: "Key prefix",    value: "am_..."                  },
                      { label: "Key header",    value: "X-API-Key"               },
                      { label: "Rate limited",  value: "HTTP 429"                },
                      { label: "Invalid key",   value: "HTTP 401"                },
                      { label: "No endpoint access", value: "HTTP 403"           },
                      { label: "API blocked",   value: "HTTP 503"                },
                      { label: "Max body size", value: "10MB"                    },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-gray-500 text-xs">{item.label}</p>
                        <p className="text-teal-400">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}