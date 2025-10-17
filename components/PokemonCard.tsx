import { useEffect, useState } from "react";
import { TouchableOpacity, Image, View, Text, Modal, ActivityIndicator, ScrollView } from "react-native";

type PokemonCardProps = {
  name: string;
  id: string;
};

export function PokemonCard({ name, id }: PokemonCardProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  const openModal = async () => {
    setModalVisible(true);
    setLoadingDetails(true);

    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await res.json();
      setDetails(data);
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <>
      {/* CARD */}
      <TouchableOpacity
        className="flex-1 bg-white rounded-2xl p-3 m-1.5 shadow shadow-gray-300 items-center justify-center"
        onPress={openModal}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: image ?? undefined }}
          alt={name}
          className="w-28 h-28 mb-2"
          resizeMode="contain"
        />
        <Text className="text-base font-semibold text-textdark capitalize">
          {name}
        </Text>
      </TouchableOpacity>



      {/* MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}

      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-3xl w-[90%] max-h-[85%] p-5 shadow-lg">
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text className="text-red-500 font-semibold text-2xl ms-auto">X</Text>
          </TouchableOpacity>
            {loadingDetails ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2F80ED" />
              </View>
            ) : details ? (
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
            ) : (
              <Text className="text-gray-500 text-center">
                Erro ao carregar dados.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
