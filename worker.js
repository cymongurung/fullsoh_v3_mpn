// Cloudflare Worker: finds the MPN code on a thedealoutlet.com product page.
// Paste into a new Worker (workers.cloudflare.com, free plan), deploy, then put its address in app.js (MPN_LOOKUP_URL).
export default {
  async fetch(req) {
    const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
    const reply = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: cors });

    let u;
    try { u = new URL(new URL(req.url).searchParams.get("u")); }
    catch { return reply({ error: "Invalid link" }, 400); }
    if (!/(^|\.)thedealoutlet\.com$/.test(u.hostname)) return reply({ error: "Only thedealoutlet.com links" }, 400);

    u.search = ""; u.hash = "";           // clean product page only
    const r = await fetch(u.toString(), {
      headers: { "User-Agent": "DealStockScanner/1.0 (staff tool)", "Accept": "text/html" }
    });
    if (!r.ok) return reply({ error: "Website returned " + r.status }, 502);

    const html = await r.text();
    const m = html.match(/"mpn"\s*:\s*"([^"]+)"/);
    return m ? reply({ mpn: m[1] }) : reply({ error: "Code not found on page" }, 404);
  }
};
