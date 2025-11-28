import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from '@expo/vector-icons';

import { getFromCache, saveToCache } from "../../utils/cache";
import { API_URL } from "@/api/index.routes";


export default function DetalhePokemon() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [details, setDetails] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!name) return;
    const key = `pokemon-details-${name}`;

    const loadDetails = async () => {

      const cached = await getFromCache(key);

      if (cached) {
        console.log("Detalhes do cache");
        setDetails(cached);

        
        fetch(`${API_URL}/pokemon/${name}`)
          .then(res => res.json())
          .then((data) => saveToCache(key, data));

        return; 
      }
    


    fetch(`${API_URL}/pokemon/${name}`)
      .then(res => res.json())
      .then(async (data) => {
        console.log("Detalhes da API");
        setDetails(data);
        await saveToCache(key, data);
      })
      .catch(console.error);
    }
    loadDetails();
  }, [name]);

  useEffect(() => {
    if (details) checkFavorite();
  }, [details]);


  const checkFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem("favorites");
      const parsed = favorites ? JSON.parse(favorites) : [];
      setIsFavorite(parsed.some((p: any) => p.id === details.id));
    } catch (error) {
      console.error(error);
    }
  };

  // Adiciona ou remove dos favoritos
  const toggleFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem("favorites");
      let parsed = favorites ? JSON.parse(favorites) : [];

      if (isFavorite) {
        // remove
        parsed = parsed.filter((p: any) => p.id !== details.id);
        await AsyncStorage.setItem("favorites", JSON.stringify(parsed));
        setIsFavorite(false);
        Alert.alert("Removido dos favoritos!");
      } else {
        // adiciona
        parsed.push({ id: details.id, name: details.name });
        await AsyncStorage.setItem("favorites", JSON.stringify(parsed));
        setIsFavorite(true);
        Alert.alert("Adicionado aos favoritos!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!details) {
    return (
      <View className="flex-1 justify-center items-center bg-background-light">
        <Text className="text-gray-500">Pokémon não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background-light p-4">

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


        <View className="flex-row mb-4 mt-4">
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

        <TouchableOpacity
          onPress={toggleFavorite}
          className={`px-4 py-2 rounded-full ${isFavorite ? 'bg-yellow-400' : 'bg-gray-300'}`}
        >
          <Text className="font-semibold text-white">
            <FontAwesome name="star" size={16} color="white" /> {isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
          </Text>
        </TouchableOpacity>
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
  tabBarStyle: { display: "none" },
};
