import { useEffect, useState } from "react";
import { TouchableOpacity, Image, View, Text } from "react-native";

type PokemonCardProps = {
  name: string;
  id: string;
};

export function PokemonCard({ name, id }: PokemonCardProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const sprite =
          data.sprites.other["official-artwork"].front_default ||
          data.sprites.front_default;
        setImage(sprite);
      })
      .catch((err) => console.error("Erro ao carregar imagem:", err))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <View className="flex-1 bg-white rounded-2xl p-3 m-1.5 shadow shadow-gray-300 items-center justify-center">
      <Image
        source={{ uri: image ?? undefined }}
        alt={name}
        className="w-28 h-28 mb-2"
        resizeMode="contain"
      />
      <Text className="text-base font-semibold text-textdark capitalize">
        {name}
      </Text>

      <TouchableOpacity className="mt-2 bg-primary rounded-lg px-3 py-1.5">
        <Text className="text-white font-medium text-sm">Ver detalhes</Text>
      </TouchableOpacity>
    </View>
  );
}
