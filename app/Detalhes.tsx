import { View, Text, Image, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

export default function DetalhePokemon() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!name) return;
    fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
      .then(res => res.json())
      .then(setDetails)
      .catch(console.error);
  }, [name]);


  if (!details) {
    return (
      <View className="flex-1 justify-center items-center bg-background-light">
        <Text className="text-gray-500">Pokémon não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background-light p-4">
      {/* Imagem e tipos */}
      <View className="items-center mb-4">
        <Image
          source={{
            uri:
              details.sprites.other["official-artwork"].front_default ||
              details.sprites.front_default,
          }}
          className="w-40 h-40 mb-3"
          resizeMode="contain"
        />

        <Text className="text-3xl font-bold capitalize text-primary mb-2">
          {details.name}
        </Text>

        <View className="flex-row mb-4">
          {details.types.map((t: any, idx: number) => (
            <View
              key={idx}
              className={`px-3 py-1 mx-1 rounded-full ${t.type.name === "grass"
                  ? "bg-green-300"
                  : t.type.name === "fire"
                    ? "bg-red-300"
                    : t.type.name === "water"
                      ? "bg-blue-300"
                      : "bg-gray-300"
                }`}
            >
              <Text className="capitalize text-sm font-semibold text-white">
                {t.type.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Status Base */}
      <View className="w-full mb-4">
        <Text className="text-xl font-semibold text-gray-700 mb-2 text-center">
          Status Base
        </Text>
        {details.stats.map((stat: any, index: number) => (
          <View key={index} className="mb-2">
            <View className="flex-row justify-between">
              <Text className="capitalize font-medium text-gray-700">
                {stat.stat.name}
              </Text>
              <Text className="font-semibold text-gray-800">
                {stat.base_stat}
              </Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <View
                className={`h-2 rounded-full ${stat.stat.name === "hp"
                    ? "bg-green-500"
                    : stat.stat.name === "attack"
                      ? "bg-red-500"
                      : stat.stat.name === "defense"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                  }`}
                style={{ width: `${stat.base_stat}%` }}
              />
            </View>
          </View>
        ))}
      </View>


      <View className="items-center">
        <Text className="text-gray-600">
          Altura: {details.height / 10} m | Peso: {details.weight / 10} kg
        </Text>
      </View>
    </ScrollView>
  );
}

export const options = {
  headerShown: false,
};