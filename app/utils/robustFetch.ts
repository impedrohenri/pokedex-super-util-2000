import { API_URL } from "@/api/index.routes";

export class NetworkError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
        this.name = "NetworkError";
    }
}


function combineSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    const onAbort = (reason: any) => {
        if (!controller.signal.aborted) controller.abort(reason);
    };

    for (const s of signals) {
        if (!s) continue;
        if (s.aborted) {
            onAbort(s.reason);
        } else {
            s.addEventListener("abort", () => onAbort(s.reason), { once: true });
        }
    }

    return controller.signal;
}


//Fallback universal de timeout usando Promise.race

function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    controller: AbortController
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            controller.abort(); //  aborta o fetch REAL
            reject(new NetworkError(`Timeout após ${ms}ms`, 408));
        }, ms);

        promise
            .then((res) => {
                clearTimeout(timeoutId);
                resolve(res);
            })
            .catch((err) => {
                clearTimeout(timeoutId);
                reject(err);
            });
    });
}


export async function robustFetch<T>(
    endpoint: string,
    externalSignal?: AbortSignal
): Promise<T> {
    const URL = `${API_URL}${endpoint}`;
    const TIMEOUT_MS = 8000;
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const localController = new AbortController();

        // signal seguro (sem AbortSignal.any)
        const signal = externalSignal
            ? combineSignals([externalSignal, localController.signal])
            : localController.signal;

        try {


            const fetchPromise = fetch(URL, { signal });

            const response = await withTimeout(fetchPromise, TIMEOUT_MS, localController);

            if (!response.ok) {
                // Retry APENAS para 5xx
                if (response.status >= 500 && response.status < 600 && attempt < MAX_RETRIES - 1) {
                    const baseDelay = Math.pow(2, attempt) * 1000;
                    const jitter = Math.random() * 500;
                    const delay = baseDelay + jitter;

                    console.warn(
                        `Erro 5xx (${response.status}). Retry em ${delay.toFixed(0)}ms...`
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }

                // 4xx não tem retry
                throw new NetworkError(
                    `Erro da API: ${response.status} (${response.statusText})`,
                    response.status
                );
            }

            return (await response.json()) as T;
        } catch (err: any) {
            // Cancelamento externo
            if (externalSignal?.aborted) {
                console.log("Requisição cancelada (debounce/unmount).");
                throw err;
            }

            // Timeout → tratado como erro de rede
            if (err instanceof NetworkError && err.status === 408) {
                if (attempt < MAX_RETRIES - 1) {
                    const baseDelay = Math.pow(2, attempt) * 1000;
                    const jitter = Math.random() * 500;
                    const delay = baseDelay + jitter;

                    console.warn(`Timeout. Retry em ${delay.toFixed(0)}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
                throw err;
            }

            // Falha de rede do RN (TypeError: Network request failed)
            if (err instanceof TypeError && err.message.includes("Network request failed")) {
                if (attempt < MAX_RETRIES - 1) {
                    const baseDelay = Math.pow(2, attempt) * 1000;
                    const jitter = Math.random() * 500;
                    const delay = baseDelay + jitter;

                    console.warn(
                        `Erro de rede (${err.message}). Retry em ${delay.toFixed(0)}ms...`
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }

                throw new NetworkError("Falha de conexão. Verifique sua internet.", 0);
            }

            // Outros erros
            throw err;
        }
    }

    throw new NetworkError("Limite de tentativas excedido.");
}
