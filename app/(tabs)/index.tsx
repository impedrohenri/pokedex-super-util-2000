import { PokemonCard } from "@/components/PokemonCard";
import { Pokemon } from "@/types/PokemonCard";
import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import fetchComConcorrencia from "../../utils/fetchComConcorrencia";
import { getFromCache, saveToCache } from "../utils/cache";
import { robustFetch, NetworkError } from "../utils/robustFetch";
import NetInfo from "@react-native-community/netinfo";
import PokemonTypeFilter from "@/components/PokemonTypeFilter";
import { IMAGE_URL } from "@/api/index.routes";
import { FetchError } from "@/types/FetchError";
import ErrorView from "@/components/ErrorView";


export default function PokedexScreen() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  // Novo estado para o erro
  const [fetchError, setFetchError] = useState<FetchError | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Ref para o AbortController para cancelamento na desmontagem ou nova busca (debounce)
  const abortControllerRef = useRef<AbortController | null>(null);

  const getImageUrl = (pokemon: Pokemon) => {
    const id = pokemon.url?.split("/").filter(Boolean).pop();
    return `${IMAGE_URL}/${id}.png`;
  };

  const updatePokemonsState = (newData: Pokemon[], currentOffset: number) => {
    setPokemons((prev) => {
      // Concatena os dados anteriores e os novos
      const combined = currentOffset === 0 ? newData : [...prev, ...newData];

      //Filtra duplicatas usando um Map pelo nome
      const uniqueMap = new Map();
      combined.forEach(pokemon => {
        // Garante que o nome é a chave única
        uniqueMap.set(pokemon.name, pokemon);
      });

      // Retorna o array de valores únicos
      return Array.from(uniqueMap.values());
    });
  };
  const fetchPokemonsByType = async (type: string) => {
    // Se houver uma requisição anterior, cancele-a (para evitar race condition e liberar recursos)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("New request initiated (debounce/offset change)");
      abortControllerRef.current = null;
    }

    // Cria um novo controller para esta nova requisição
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setFetchError(null); // Limpa o erro ao iniciar nova busca
    const endpointType = `/type/${type}`
    const key = `pokemon-type-${type}`;

    try {
      // tenta pegar do cache primeiro
      const cached = await getFromCache(key);
      if (cached) {
        console.log("Dados de tipo vindos do cache");
        setPokemons(cached);
        setLoading(false);
        return;
      }

      // busca da API

      const data = await robustFetch<any>(endpointType, controller.signal);

      const list = data.pokemon.map((p: any) => p.pokemon);

      setPokemons(list);

      await saveToCache(key, list);
    } catch (err: any) {
      console.log("Erro ao buscar Pokémon por tipo:", err);

      setFetchError({
        message: "Não foi possível carregar os Pokémons desse tipo.",
        isNetwork:
          err instanceof NetworkError ||
          (typeof err?.message === "string" &&
            err.message.includes("Failed to fetch")),
        canRetry: true,
      });

      setPokemons([]); // Garante que a tela de erro apareça
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemons = async (forceRefetch: boolean = false) => {
    // Se houver uma requisição anterior, cancele-a (para evitar race condition e liberar recursos)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("New request initiated (debounce/offset change)");
      abortControllerRef.current = null;
    }

    // Cria um novo controller para esta nova requisição
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setFetchError(null); // Limpa o erro ao iniciar nova busca
    if (filter !== "all") {
      return fetchPokemonsByType(filter);
    }
    const key = `pokemon-list-${offset}`;
    const endpoint = `/pokemon?limit=20&offset=${offset}`;

    try {
      // Tenta pegar do cache primeiro
      const cached = await getFromCache(key);

      if (cached && !forceRefetch) {
        console.log("Dados vindos do cache");
        updatePokemonsState(cached, offset);
        Promise.allSettled(
          cached.map((p: any) => Image.prefetch(getImageUrl(p)))
        );
        // Atualiza em background (com robustez)
        robustFetch<any>(endpoint, controller.signal)
          .then((data) => {
            saveToCache(key, data.results);
            console.log("Cache atualizado em background.");
          })
          .catch((error) => {
            if ((error.name === 'AbortError')) {
              console.error("Erro ao atualizar o cache em background:", error);
            }
          });

        setLoading(false);
        return;
      }

      // Fetch principal (com robustez)
      const data = await robustFetch<any>(endpoint, controller.signal);

      console.log("Dados vindos da API (robustos)");

      updatePokemonsState(data.results, offset);
      await saveToCache(key, data.results); // Salva no cache agora
      fetchComConcorrencia(
        data.results.map((p: any) => Image.prefetch(getImageUrl(p))),
        5
      );
    } catch (error: any) {
      // Tratamento de erros com UI de “tentar novamente”
      console.error("Erro ao buscar pokémons:", error);

      if (error.name === 'AbortError') {
        // Requisição cancelada intencionalmente (p.ex., nova busca de debounce ou unmount). Não mostrar erro na tela.
        return;
      }

      // Define o erro para exibição
      setFetchError({
        message: error.message || "Ocorreu um erro desconhecido ao carregar os dados.",
        isNetwork: error instanceof NetworkError ||
          (typeof error?.message === "string" &&
            error.message.includes("Failed to fetch")),
        canRetry: true, // Quase sempre deve ter retry para erros de rede/timeout/5xx
      });

    } finally {
      // Garante que o controller é liberado se for o controller atual
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setLoading(false);
    }
  };



  // Handler para o botão "Tentar Novamente"
  const handleRetry = () => {
    // Se a lista estiver vazia, tenta buscar a primeira página. 
    // Se já tiver itens (erro na paginação), tenta buscar o offset atual.
    if (pokemons.length === 0 && offset !== 0) {
      // Reseta para a primeira página em caso de falha inicial
      setOffset(0);
    } else {
      // Tenta buscar o offset atual novamente
      fetchPokemons(true);
    }
  }

  // useEffect para monitorar o NetInfo
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    // Limpeza: Cancelar qualquer requisição pendente quando o componente for desmontado
    return () => {
      unsubscribe();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort("Componente PokedexScreen desmontado");
      }
    };
  }, []);

  // useEffect para paginação e reagir a mudança de rede
  useEffect(() => {
    fetchPokemons();
  }, [offset]);

  useEffect(() => {
    if (filter === "all") {
      setOffset(0);
    }

    fetchPokemons();

  }, [filter]);



  // --- Renderização ---

  if (loading && pokemons.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-200">
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  if (fetchError && pokemons.length === 0) {
    // Exibe o erro de tela cheia se a lista estiver vazia
    return (

      <ErrorView fetchError={fetchError} handleRetry={handleRetry}/>

    );
  }

  return (
    <View className="flex-1 bg-gray-200 px-3 pt-6">
      {/* aviso do offline */}
      {isOffline && (
        <View className="absolute top-0 left-0 right-0 p-1 z-10 bg-black items-center">
          <Text className="text-white text-xs font-bold">
            🚫 MODO OFFLINE: Usando dados em cache.
          </Text>
        </View>
      )}
      <View className="pb-2">
        <PokemonTypeFilter setFilter={setFilter} filter={filter} />
      </View>

      <FlatList
        className="mt-2"
        data={pokemons}
        numColumns={2}
        extraData={{ loading, fetchError }} // Adicionado para forçar re-render do footer
        keyExtractor={(item) =>
          item.url?.split("/").filter(Boolean).pop() || item.name
        }

        renderItem={({ item }) => {
          const id = item?.url?.split("/").filter(Boolean).pop();
          return <PokemonCard name={item.name} id={id || ''} />;
        }}
        onEndReached={() => {
          // A paginação deve ser desativada ao filtrar por tipo, pois a lista de tipos é completa.
          if (!loading && !fetchError && filter === "all") {
            setOffset((prev) => prev + 20);
          }
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponent={() => {
          if (loading && pokemons.length > 0) {
            return (
              <View className="my-4 items-center">
                <ActivityIndicator size="large" color="#FF0000" />
              </View>
            );
          }
          if (fetchError && pokemons.length > 0) {
            return (
              <View className="my-4 p-4 items-center border border-red-300 rounded-lg mx-2">
                <Text className="text-sm font-bold text-red-600 mb-2">
                  Falha ao carregar mais Pokémons.
                </Text>
                <TouchableOpacity
                  onPress={handleRetry}
                  className="bg-red-600 py-2 px-4 rounded-lg"
                >
                  <Text className="text-white text-sm font-bold">
                    Tentar Novamente
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }
          // Adiciona um espaçamento no final da lista, se necessário
          return <View style={{ height: 20 }} />;
        }}
      />
    </View>
  );
}