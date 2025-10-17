import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const searchPokemon = async () => {
    const name = query.trim().toLowerCase();
    if (!name) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      if (res.status === 404) {
        setError("Pokémon não encontrado");
        return;
      }
      if (!res.ok) throw new Error("Erro ao buscar Pokémon");

      const data = await res.json();

      router.push({
        pathname: "/(tabs)/Detalhes/[name]",
        params: { name: data.name },
      });
    } catch (e) {
      setError("Erro na busca. Tente novamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="w-full px-3 mb-4">
      <View className="flex-row items-center bg-white rounded-xl px-3 py-2 shadow">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar Pokémon"
          className="flex-1 text-base"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={searchPokemon}
          className={`ml-2 px-3 py-1 rounded-lg ${
            loading ? "bg-gray-300" : "bg-red-500"
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Buscar</Text>
          )}
        </TouchableOpacity>
      </View>
      {error && <Text className="text-red-500 mt-1 text-sm">{error}</Text>}
    </View>
  );
}
