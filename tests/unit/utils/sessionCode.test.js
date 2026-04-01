import { describe, test, expect } from 'vitest';
import { SESSION_CONFIG } from '../../../src/config/constants';
import { generateSessionCode, normalizeSessionCode, validateSessionCode } from '../../../src/utils/sessionCode';

describe('generateSessionCode', () => {
    test('deve gerar código com tamanho configurado', () => {
        const code = generateSessionCode();
        expect(code.length).toBe(SESSION_CONFIG.CODE_LENGTH);
    });

    test('deve gerar apenas números', () => {
        const code = generateSessionCode();
        expect(/^\d+$/.test(code)).toBe(true);
    });

    test('não deve gerar códigos duplicados em 1000 tentativas', () => {
        const codes = new Set();
        for (let i = 0; i < 1000; i++) {
            codes.add(generateSessionCode());
        }
        // Expect very high uniqueness
        expect(codes.size).toBeGreaterThan(990);
    });
});

describe('validateSessionCode', () => {
    test('deve aceitar código válido com tamanho configurado', () => {
        expect(validateSessionCode('12345678')).toBe(true);
    });

    test('deve rejeitar código com menos dígitos que o configurado', () => {
        expect(validateSessionCode('1234567')).toBe(false);
    });

    test('deve rejeitar código com letras', () => {
        expect(validateSessionCode('12A45678')).toBe(false);
    });

    test('deve rejeitar código null/undefined', () => {
        expect(validateSessionCode(null)).toBe(false);
        expect(validateSessionCode(undefined)).toBe(false);
    });
});

describe('normalizeSessionCode', () => {
    test('deve remover espaços nas extremidades', () => {
        expect(normalizeSessionCode(' 12345678 ')).toBe('12345678');
    });

    test('deve retornar string vazia para valores inválidos', () => {
        expect(normalizeSessionCode(null)).toBe('');
    });
});
