import { PokemonCard } from "@/components/PokemonCard";
import SearchBar from "@/components/SearchBar";
import { Pokemon } from "@/types/PokemonCard";
import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, } from "react-native";
import { getFromCache, saveToCache } from "../utils/cache";
import { API_URL } from "@/api/index.routes"
//biblioteca para detecta estado de conexão
import NetInfo from "@react-native-community/netinfo";
import PokemonTypeFilter from "@/components/PokemonTypeFilter";
import fetchComConcorrencia from "../../utils/fetchComConcorrencia";

export default function PokedexScreen() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);


  const [isOffline, setIsOffline] = useState(false);

  const [filter, setFilter] = useState<string>("all");
  const abortController = new AbortController();

  const fetchPokemonsByType = async (type: string) => {
    setLoading(true);

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
      const response = await fetch(`${API_URL}/type/${type}`);
      const data = await response.json();

      const list = data.pokemon.map((p: any) => p.pokemon);

      setPokemons(list);

      await saveToCache(key, list);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemons = async () => {
    setLoading(true);

    if (filter !== "all") {
      return fetchPokemonsByType(filter);
    }

    const key = `pokemon-list-${offset}`;// chave única por página, a chave ficará lá dentro do map no cache.ts

    try {
      //tenta pegar do cache primeiro
      const cached = await getFromCache(key);

      if (cached) {
        console.log("Dados vindos do cache");
        setPokemons(cached);

        // atualiza em background (não atrapalha o usuário)
        fetch(`${API_URL}/pokemon?limit=20&offset=${offset}`)
          .then((res) => res.json())
          .then((data) => saveToCache(key, data.results));

        setLoading(false);
        return; // evita o fetch principal
      }
      //fetch principal
      fetch(`${API_URL}/pokemon?limit=20&offset=${offset}`)
        .then((res) => res.json())
        .then(async (data) => {
          console.log("Dados vindos da API")
          setPokemons((prev) => [...prev, ...data.results]);
          // salva no cache agora
          await saveToCache(key, data.results);
        })
        .catch((error) => console.error("Erro ao buscar pokémons:", error))
        .finally(() => {
          setLoading(false);
          console.log(pokemons)

        });
    } catch (error) {
      console.error("Erro ao buscar pokémons:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPokemons();
  }, [offset]);

  //useEffect para monitorar o NetInfo
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []); // Roda apenas uma vez na montagem

  //useEffect para reagir a mudança de rede
  useEffect(() => {
    // Dispara uma nova busca sempre que a rede mudar, usando o novo estado 'isOffline'
    console.log(`Estado da Rede alterado. isOffline: ${isOffline}`);
    fetchPokemons();
  }, [isOffline]); // Roda sempre que o estado de rede muda

  // useEffect existente para paginação
  useEffect(() => {
    fetchPokemons();
  }, [offset]);

  useEffect(() => {
    if (filter === "all") {
      setOffset(0);
    }

    fetchPokemons();

  }, [filter]);


  return (
    <View className="flex-1 bg-gray-200 px-3 pt-4">
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
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2F80ED" />
        </View>
      ) : (
        <>
          <FlatList
          className="mt-2"
            data={pokemons}
            numColumns={2}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => {
              const id = item?.url?.split("/").filter(Boolean).pop();
              return <PokemonCard name={item.name} id={id || ''} />;
            }}
            onEndReached={() => setOffset((prev) => prev + 20)}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              loading ? (
                <View className="my-4 items-center">
                  <ActivityIndicator size="large" color="#2F80ED" />
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}
