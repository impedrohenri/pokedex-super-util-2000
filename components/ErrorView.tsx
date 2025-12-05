import { FetchError } from "@/types/FetchError";
import { View, TouchableOpacity, Text } from "react-native";

interface IErrorViewProps{
    fetchError: FetchError | null,
    handleRetry: () => void
}

export default function ErrorView({fetchError, handleRetry}: IErrorViewProps){
    return (
        <View className="flex-1 justify-center items-center p-6">
            <Text className="text-xl font-bold text-red-600 mb-4">
                🚨 Erro de Rede
            </Text>
            <Text className="text-center text-gray-700 mb-6">
                {fetchError?.message}
            </Text>
            {fetchError?.canRetry && (
                <TouchableOpacity
                onPress={handleRetry}
                className=" bg-red-500 py-3 px-6 rounded-lg"
                >
                    <Text className="text-white text-base font-bold">
                        Tentar Novamente
                    </Text>
                </TouchableOpacity>
            )}
    </View>
    )
}