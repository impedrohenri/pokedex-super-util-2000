import { PokemonCard } from "@/components/PokemonCard";
import SearchBar from "@/components/SearchBar";
import { Pokemon } from "@/types/PokemonCard";
import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity,} from "react-native";

export default function PokedexScreen() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPokemons = () => {
    setLoading(true);

    try {
      fetch(`https://pokeapi.co/api/v2/pokemon?limit=20&offset=${offset}`)
        .then((res) => res.json())
        .then((data) => {
          setPokemons(data.results);
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

  return (
    <View className="flex-1 bg-background-light px-3 pt-6">
      {loading ? (
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
              return <PokemonCard name={item.name} id={id || ""} />;
            }}
          />

          <View className="flex-row justify-between items-center py-4">
            <TouchableOpacity
              disabled={offset === 0 || loading}
              onPress={() => setOffset((prev) => Math.max(prev - 20, 0))}
              className={`px-4 py-2 rounded-xl ${
                offset === 0 || loading
                  ? "bg-red-300"
                  : "bg-red-600"
              }`}
            >
              <Text
                className={`font-bold text-white`}
              >
                Anterior
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={loading}
              onPress={() => setOffset((prev) => prev + 20)}
              className={`px-4 py-2 rounded-xl ${
                loading ? "bg-red-300" : "bg-red-600"
              }`}
            >
              <Text
                className={`font-bold text-white`}
              >
                Próximo
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
