import AsyncStorage from "@react-native-async-storage/async-storage";

const memoryCache = new Map<string, { data: any; expires: number }>();

const TTL = 1000 * 60 * 30; // 30 minutos

export async function getFromCache(key: string) {
  const now = Date.now();
  

  // 1) Tenta memória
  const mem = memoryCache.get(key);
  if (mem && mem.expires > now) {
    return mem.data;
  }

  // 2) Tenta AsyncStorage
  const saved = await AsyncStorage.getItem(key);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.expires > now) {
      // coloca em memória
      memoryCache.set(key, parsed);
      return parsed.data;
    }
  }

  return null; // Nada encontrado
}

export async function saveToCache(key: string, data: any, ttl = TTL) {
  const entry = {
    data,
    expires: Date.now() + ttl
  };

  memoryCache.set(key, entry);
  await AsyncStorage.setItem(key, JSON.stringify(entry));
}
