import { describe, test, expect } from 'vitest';
import { generateSessionCode, normalizeSessionCode, validateSessionCode } from '../../../src/utils/sessionCode';

describe('generateSessionCode', () => {
    test('deve gerar código de 6 dígitos', () => {
        const code = generateSessionCode();
        expect(code.length).toBe(6);
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
    test('deve aceitar código válido de 6 dígitos', () => {
        expect(validateSessionCode('123456')).toBe(true);
    });

    test('deve rejeitar código com menos de 6 dígitos', () => {
        expect(validateSessionCode('12345')).toBe(false);
    });

    test('deve rejeitar código com letras', () => {
        expect(validateSessionCode('12A456')).toBe(false);
    });

    test('deve rejeitar código null/undefined', () => {
        expect(validateSessionCode(null)).toBe(false);
        expect(validateSessionCode(undefined)).toBe(false);
    });
});

describe('normalizeSessionCode', () => {
    test('deve remover espaços nas extremidades', () => {
        expect(normalizeSessionCode(' 123456 ')).toBe('123456');
    });

    test('deve retornar string vazia para valores inválidos', () => {
        expect(normalizeSessionCode(null)).toBe('');
    });
});
