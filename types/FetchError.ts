// Interface para o objeto de erro
export interface FetchError {
  message: string;
  isNetwork: boolean; // Para diferenciar se é um erro de rede/servidor ou outro
  canRetry: boolean; // Indica se o botão "Tentar Novamente" deve aparecer
}