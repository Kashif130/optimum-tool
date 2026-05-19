// Server-side proxy — avoids CORS, response cached 30 seconds at edge
export const revalidate = 30;

export async function GET() {
  const [priceRes, aprRes] = await Promise.allSettled([
    fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true',
      { next: { revalidate: 30 } }
    ),
    fetch('https://beaconcha.in/api/v1/ethstore/latest', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    }),
  ]);

  let ethPrice = null, ethChange24h = null, ethMarketCap = null;
  if (priceRes.status === 'fulfilled') {
    const j = await priceRes.value.json();
    ethPrice     = j?.ethereum?.usd            ?? null;
    ethChange24h = j?.ethereum?.usd_24h_change ?? null;
    ethMarketCap = j?.ethereum?.usd_market_cap ?? null;
  }

  let stakingApr = null, clApr = null, elApr = null;
  if (aprRes.status === 'fulfilled') {
    const j = await aprRes.value.json();
    // beaconcha.in returns apr as decimal (e.g. 0.035 = 3.5%)
    const raw = j?.data?.apr ?? j?.data?.validatorapr ?? null;
    stakingApr = raw !== null ? (raw < 1 ? raw * 100 : raw) : null;
    clApr      = j?.data?.cl_apr != null ? (j.data.cl_apr < 1 ? j.data.cl_apr * 100 : j.data.cl_apr) : null;
    elApr      = j?.data?.el_apr != null ? (j.data.el_apr < 1 ? j.data.el_apr * 100 : j.data.el_apr) : null;
  }

  return Response.json({ ethPrice, ethChange24h, ethMarketCap, stakingApr, clApr, elApr });
}
