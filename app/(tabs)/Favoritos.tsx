import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useState,useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PokemonCard } from "@/components/PokemonCard";
import { Pokemon } from "@/types/PokemonCard";

import { useFocusEffect } from "expo-router";
export default function FavoritosScreen() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);

  // Lê os favoritos do AsyncStorage
  const loadFavorites = async () => {
    setLoading(true);
    try {
      const favorites = await AsyncStorage.getItem("favorites");
      const parsed: { id: number; name: string }[] = favorites
        ? JSON.parse(favorites)
        : [];
      setPokemons(parsed);
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

 //Toda vez que a tela ganhar foco → recarrega
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-200">
        <ActivityIndicator size="large" color="#2F80ED" />
      </View>
    );
  }

  if (pokemons.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-200 px-3">
        <Text className="text-gray-600 text-lg">
          Nenhum Pokémon favorito ainda.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-200 px-3 pt-6">
      <FlatList
        data={pokemons}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          return <PokemonCard name={item.name} id={item.id.toString()} />;
        }}
      />
    </View>
  );
}
