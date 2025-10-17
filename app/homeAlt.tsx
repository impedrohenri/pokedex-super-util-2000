import { PokemonCard } from "@/components/PokemonCard";
import { Pokemon } from "@/types/PokemonCard";
import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";




export default function PokedexScreen() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadRequest, setReloadRequest] = useState(false)

  useEffect(() => {

    try {
      fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=20&offset=${offset}`
      )
      .then(res => {
        return res.json();
      })
      .then(data => {
        setPokemons((prev) => [...prev, ...data.results]);
        console.log(pokemons)
        setOffset((prev) => prev + 20);
      })
    } catch (error) {
      console.error("Erro ao buscar pokémons:", error);
    } finally {
      setLoading(false);
    }
  }, [reloadRequest]);

  return (
    <View className="flex-1 bg-background-light px-3 pt-6">
      <Text className="text-2xl font-bold text-primary mb-4">Pokédex</Text>

      <FlatList
        data={pokemons}
        numColumns={2}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => {
          const id = item?.url?.split("/").filter(Boolean).pop();
          return <PokemonCard name={item.name} id={id || ''} />;
        }}
        onEndReached={() => setReloadRequest(!reloadRequest)}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          loading ? (
            <View className="my-4 items-center">
              <ActivityIndicator size="large" color="#2F80ED" />
            </View>
          ) : null
        }
      />
    </View>
  );
}
