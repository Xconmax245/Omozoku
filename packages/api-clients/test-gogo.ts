import { LocalGogoStreamProvider } from './src/stream-provider';

async function main() {
  const provider = new LocalGogoStreamProvider();
  try {
    // Attack on Titan (Shingeki no Kyojin) - MAL ID 16498
    console.log('Resolving episode ID...');
    const epId = await provider.resolveEpisodeId(16498, 1);
    console.log('Resolved to:', epId);
    console.log('Fetching sources...');
    const sources = await provider.getSources(epId);
    console.log('Sources:', JSON.stringify(sources, null, 2));
  } catch (err) {
    console.error('Failed:', err);
  }
}

main();
