import React from 'react'
import { View, TouchableOpacity, Text, ScrollView } from 'react-native'

interface IProps {
    setFilter: (value: string) => void;
    filter: string
}


export default function PokemonTypeFilter({ setFilter, filter }: IProps) {


    const PokemonTypesData: Record<string, { label: string, colorClass: string }> = {
        all: { label: "Todos", colorClass: 'bg-gray-500' },
        normal: { label: "Normal", colorClass: 'bg-gray-400' },
        fire: { label: "Fogo", colorClass: 'bg-red-500' },
        water: { label: "Água", colorClass: 'bg-blue-500' },
        grass: { label: "Grama", colorClass: 'bg-green-500' },
        electric: { label: "Elétrico", colorClass: 'bg-yellow-400' },
        ice: { label: "Gelo", colorClass: 'bg-cyan-300' },
        fighting: { label: "Lutador", colorClass: 'bg-red-700' },
        poison: { label: "Veneno", colorClass: 'bg-purple-600' },
        ground: { label: "Terra", colorClass: 'bg-amber-700' },
        flying: { label: "Voador", colorClass: 'bg-indigo-400' },
        psychic: { label: "Psíquico", colorClass: 'bg-pink-500' },
        bug: { label: "Inseto", colorClass: 'bg-lime-600' },
        rock: { label: "Pedra", colorClass: 'bg-amber-800' },
        ghost: { label: "Fantasma", colorClass: 'bg-indigo-700' },
        dragon: { label: "Dragão", colorClass: 'bg-indigo-900' },
        steel: { label: "Aço", colorClass: 'bg-gray-500' },
        dark: { label: "Sombrio", colorClass: 'bg-gray-800' },
        fairy: { label: "Fada", colorClass: 'bg-pink-300' },
    };


    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}

        >
            <View className="flex-row gap-2 px-1">
                {/* Mapeamos as chaves (keys) do objeto, que são os IDs dos tipos */}
                {Object.keys(PokemonTypesData).map((typeId) => {
                    const isActive = filter === typeId;
                    
                    // Acessamos os dados do tipo diretamente pelo ID (chave)
                    const typeData = PokemonTypesData[typeId];

                    const baseStyle = 'px-4 py-2 rounded-full transition-all duration-300';

                    // Usamos a classe de cor do objeto
                    const activeStyle = isActive ? `${typeData.colorClass} border-2 border-white` : 'bg-gray-300';
                    const textStyle = isActive ? 'text-white font-bold' : 'text-gray-700';

                    return (
                        <TouchableOpacity
                            key={typeId} // Usamos o ID como chave
                            onPress={() => setFilter(typeId)} // Passamos o ID para o setFilter
                            className={`${baseStyle} ${activeStyle}`}
                        >
                            {/* Usamos o label traduzido do objeto */}
                            <Text className={textStyle}>
                                {typeData.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    )
}
