import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  TouchableOpacity,
  Image,
  View,
  Text,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import { getFromCache, saveToCache } from "../app/utils/cache";
import { robustFetch, NetworkError } from "../app/utils/robustFetch";

type PokemonCardProps = {
  name: string;
  id: string;
};

const POKEAPI_ENDPOINT = "/pokemon/";

export function PokemonCard({ name, id }: PokemonCardProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const router = useRouter();

  
  const loadImage = async (allowCache = true) => {
    setLoading(true);
    setImageError(false);

    const controller = new AbortController();
    const signal = controller.signal;

    const key = `pokemon-image-${id}`;
    const endpoint = `${POKEAPI_ENDPOINT}${id}`;

    try {
      // Tenta pelo cache
      if (allowCache) {
        const cached = await getFromCache(key);
        if (cached) {
          setImage(cached);
          setLoading(false);

          // Atualiza o cache em segundo plano
          robustFetch<any>(endpoint)
            .then((data) => {
              const sprite =
                data.sprites?.other?.["official-artwork"]?.front_default ||
                data.sprites?.front_default;

              if (sprite) saveToCache(key, sprite);
            })
            .catch(() => {});

          return;
        }
      }

      // Fetch principal
      const data = await robustFetch<any>(endpoint, signal);

      const sprite =
        data.sprites?.other?.["official-artwork"]?.front_default ||
        data.sprites?.front_default;

      if (!sprite) throw new Error("Sprite não encontrada");

      setImage(sprite);
      await saveToCache(key, sprite);
    } catch (error) {
      console.error("Erro ao carregar imagem:", error);
      setImageError(true);
    } finally {
      setLoading(false);
    }
  };

  // Retry do botão
  const retryLoadImage = () => loadImage(false);

  // Carrega ao montar
  useEffect(() => {
    loadImage();
  }, [id]);

  
  const openModal = async () => {
    setModalVisible(true);
    setLoadingDetails(true);
    setDetailsError(null);

    const key = `pokemon-details-${id}`;
    const endpoint = `${POKEAPI_ENDPOINT}${id}`;

    try {
      // Cache
      const cached = await getFromCache(key);
      if (cached) {
        setDetails(cached);

        // Atualiza em segundo plano
        robustFetch<any>(endpoint).then((data) => saveToCache(key, data));

        setLoadingDetails(false);
        return;
      }

      // Fetch principal
      const data = await robustFetch<any>(endpoint);
      setDetails(data);
      await saveToCache(key, data);
    } catch (error) {
      if (error instanceof NetworkError) {
        setDetailsError(error.message);
      } else {
        setDetailsError("Erro desconhecido ao buscar detalhes.");
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <>
      <View className="flex-1 bg-white rounded-2xl p-3 m-1.5 shadow shadow-gray-300 items-center justify-center">
        <TouchableOpacity
          onPress={openModal}
          activeOpacity={0.85}
          className="flex items-center justify-center"
        >
          
          {loading ? (
            <ActivityIndicator size="large" color="#2F80ED" />
          ) : imageError || !image ? (
            <View className="w-28 h-28 mb-2 items-center justify-center">
              <Text className="text-gray-400 text-center mb-1">
                ❌ Falha ao carregar
              </Text>

              <TouchableOpacity
                onPress={retryLoadImage}
                className="bg-red-500 py-1 px-3 rounded-lg"
              >
                <Text className="text-white text-xs font-semibold">
                  Tentar Novamente
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Image
              source={{ uri: image }}
              className="w-28 h-28 mb-2"
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          )}

          <Text className="text-base font-semibold text-textdark capitalize">
            {name}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/Detalhes/[name]",
              params: { name },
            })
          }
          className="mt-4 px-3 py-1 rounded-lg text-sm"
          style={{ backgroundColor: "#ecc972" }}
        >
          <Text className="text-white font-semibold">Ver detalhes</Text>
        </TouchableOpacity>
      </View>

      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black bg-opacity-60 justify-center items-center">
          <View className="w-11/12 max-h-[85%] bg-white p-6 rounded-2xl shadow-xl">
            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingDetails ? (
                <ActivityIndicator size="large" color="#2F80ED" />
              ) : detailsError ? (
                <View className="items-center">
                  <Text className="text-red-500 mb-3 text-center">
                    {detailsError}
                  </Text>
                  <TouchableOpacity
                    onPress={openModal}
                    className="bg-blue-500 py-2 px-4 rounded-lg"
                  >
                    <Text className="text-white font-bold">Tentar Novamente</Text>
                  </TouchableOpacity>
                </View>
              ) :  details ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="items-center">
                  <Image
                    source={{
                      uri:
                        details.sprites.other["official-artwork"].front_default ||
                        details.sprites.front_default,
                    }}
                    className="w-40 h-40 mb-3"
                    resizeMode="contain"
                  />

                  <Text className="text-2xl font-bold capitalize text-primary mb-1">
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
                        <Text className="capitalize text-sm font-semibold text-white drop-shadow">
                          {t.type.name}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View className="w-full">
                    <Text className="text-lg font-semibold text-gray-700 mb-2 text-center">
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

                  <View className="mt-6 items-center">
                    <Text className="text-gray-600">
                      Altura: {details.height / 10} m | Peso:{" "}
                      {details.weight / 10} kg
                    </Text>

                    <TouchableOpacity
                      className="mt-6 bg-primary px-5 py-2 rounded-xl"
                      onPress={() => setModalVisible(false)}
                    >
                      <Text className="text-white font-semibold">Fechar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            ) : null}
            </ScrollView>

          </View>
        </View>
      </Modal>
    </>
  );
}
