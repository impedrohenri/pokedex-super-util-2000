import { PokemonCard } from "@/components/PokemonCard";
import SearchBar from "@/components/SearchBar";
import { Pokemon } from "@/types/PokemonCard";
import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, } from "react-native";
import { getFromCache, saveToCache } from "../utils/cache";
import { API_URL } from "@/api/index.routes"
//biblioteca para detecta estado de conexão
import NetInfo from "@react-native-community/netinfo";


export default function PokedexScreen() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);


  const [isOffline, setIsOffline] = useState(false);

  const fetchPokemons = async () => {
    setLoading(true);

    const key = `pokemon-list-${offset}`;// chave única por página, a chave ficará lá dentro do map no cache.ts

    try {
      //tenta pegar do cache primeiro
      const cached = await getFromCache(key);

      if (cached) {
        console.log("Dados vindos do cache");
        setPokemons((prev) =>
          offset === 0 ? cached : [...prev, ...cached]
        );

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
          setPokemons((prev) =>
            offset === 0 ? data.results : [...prev, ...data.results]
          );
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

  //useEffect para monitorar o NetInfo
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []); // Roda apenas uma vez na montagem

  //useEffect para paginação e reagir a mudança de rede
  useEffect(() => {
    fetchPokemons();
  }, [offset, isOffline]); // Roda sempre que o estado de rede muda



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
      {/* mostra o loader de tela cheia SOMENTE se loading for true E a lista estiver VAZIA */}
      {loading && pokemons.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2F80ED" />
        </View>
      ) : (
        <>
          <FlatList
            data={pokemons}
            numColumns={2}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => {
              const id = item?.url?.split("/").filter(Boolean).pop();
              return <PokemonCard name={item.name} id={id || ''} />;
            }}
            onEndReached={() => {
              if (!loading) { // evita chamadas múltiplas enquanto carrega
                setOffset((prev) => prev + 20)
              }
            }}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              /* o loader de rodapé aparece quando está carregando, mas já tem itens na lista */
              loading && pokemons.length > 0 ? (
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
