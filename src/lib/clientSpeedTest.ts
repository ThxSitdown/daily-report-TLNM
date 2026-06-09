export async function runClientSpeedTest() {
  const downloadSize = 10_000_000

  const dlStart = performance.now()

  const dlRes = await fetch(
    `https://speed.cloudflare.com/__down?bytes=${downloadSize}&t=${Date.now()}`,
    {
      cache: 'no-store',
    }
  )

  const blob = await dlRes.blob()

  const dlTime = (performance.now() - dlStart) / 1000

  const downloadMbps =
    (blob.size * 8) /
    dlTime /
    1_000_000

  const uploadData = new Uint8Array(1_000_000)

  crypto.getRandomValues(uploadData)

  const ulStart = performance.now()

  await fetch(
    'https://speed.cloudflare.com/__up',
    {
      method: 'POST',
      body: uploadData,
      cache: 'no-store',
    }
  )

  const ulTime = (performance.now() - ulStart) / 1000

  const uploadMbps =
    (uploadData.length * 8) /
    ulTime /
    1_000_000

  return {
    download: downloadMbps.toFixed(1),
    upload: uploadMbps.toFixed(1),
  }
}