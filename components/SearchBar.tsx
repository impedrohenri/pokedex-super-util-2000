import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();


  const searchPokemon = async (name: string) => {
    name = name.trim().toLowerCase();
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


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  

  useEffect(() => {
    if (debouncedQuery.trim() !== "") {
      searchPokemon(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <View className="w-full px-2 mb-4">
      <View className="flex-row items-center bg-white rounded-xl px-3 py-2 shadow">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar Pokémon"
          className="flex-1 text-black"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => searchPokemon(query)}
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
      {error && <Text className="text-white mt-2 text-sm">{error}</Text>}
    </View>
  );
}
