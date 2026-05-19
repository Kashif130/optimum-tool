// Server-side proxy — no CORS, cached 60 seconds
export const revalidate = 60;

export async function GET() {
  const [epochRes, ghRes] = await Promise.allSettled([
    fetch('https://beaconcha.in/api/v1/epoch/latest', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    }),
    fetch('https://api.github.com/repos/getoptimum/mump2p/releases/latest', {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      next: { revalidate: 300 },
    }),
  ]);

  let totalValidators = null, totalStakedEth = null, currentEpoch = null;
  if (epochRes.status === 'fulfilled') {
    const j = await epochRes.value.json();
    totalValidators = j?.data?.validatorscount ?? null;
    totalStakedEth  = totalValidators ? totalValidators * 32 : null;
    currentEpoch    = j?.data?.epoch ?? null;
  }

  let mump2pVersion = null, mump2pPublishedAt = null, mump2pDownloadUrl = null;
  if (ghRes.status === 'fulfilled') {
    const j = await ghRes.value.json();
    if (!j?.message) { // "message" field means error (e.g. 404)
      mump2pVersion     = j?.tag_name            ?? null;
      mump2pPublishedAt = j?.published_at         ?? null;
      mump2pDownloadUrl = j?.assets?.[0]?.browser_download_url ?? null;
    }
  }

  return Response.json({ totalValidators, totalStakedEth, currentEpoch, mump2pVersion, mump2pPublishedAt, mump2pDownloadUrl });
}
