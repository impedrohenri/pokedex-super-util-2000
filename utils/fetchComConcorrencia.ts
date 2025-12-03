async function fetchComConcorrencia(urls: string[], limit = 5) {
  const results: any[] = [];
  let index = 0;

  async function worker() {
    while (index < urls.length) {
      const i = index++;
      try {
        const response = await fetch(urls[i]);
        results[i] = await response.json();
      } catch (e) {
        results[i] = null;
      }
    }
  }

  const workers = Array.from({ length: limit }, worker);
  await Promise.all(workers);

  return results;
}

export default fetchComConcorrencia;