/**
 * Logger utilitário para o projeto Focally.
 * Em produção, omite logs padrão de debug para evitar poluição do console
 * e não vazar fluxo interno da aplicação.
 */
export const logger = {
    log: (...args) => {
        if (import.meta.env.DEV && !import.meta.env.VITEST) {
            console.log(...args);
        }
    },
    warn: (...args) => {
        // Alertas ainda são exibidos, útil para monitorar comportamentos imprevistos
        console.warn(...args);
    },
    error: (...args) => {
        // Erros reais devem ser rastreáveis
        console.error(...args);
    }
};
