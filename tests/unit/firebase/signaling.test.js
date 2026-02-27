import { describe, test, expect, vi, beforeEach } from 'vitest';
import { FirebaseSignalingService } from '../../../src/core/signaling/FirebaseSignalingService';
import * as config from '../../../src/firebase/config';

// Mock do Firebase Database
vi.mock('firebase/database', () => {
    return {
        ref: vi.fn(),
        set: vi.fn(),
        onValue: vi.fn(),
        off: vi.fn(),
        remove: vi.fn(),
        onChildAdded: vi.fn(),
        onChildRemoved: vi.fn()
    };
});

// Mock da configuração para evitar erros de validação
vi.mock('../../../src/firebase/config', () => {
    return {
        database: {},
        isFirebaseConfigured: true
    };
});

describe('FirebaseSignalingService', () => {
    let service;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new FirebaseSignalingService();
    });

    describe('createSession', () => {
        test('deve criar sessão com estrutura correta', async () => {
            const { set, ref } = await import('firebase/database');

            ref.mockReturnValue('mock-ref');
            set.mockResolvedValue(true);

            await service.createSession('123456');

            expect(ref).toHaveBeenCalledWith(config.database, 'sessions/123456');
            expect(set).toHaveBeenCalledWith('mock-ref', expect.objectContaining({
                offers: {},
                answers: {},
                createdAt: expect.any(Number)
            }));
        });

        test('deve lançar erro se Firebase não configurado', async () => {
            config.isFirebaseConfigured = false;
            await expect(service.createSession('123456')).rejects.toThrow('Firebase não está configurado');
            config.isFirebaseConfigured = true; // reset
        });
    });

    describe('sendOffer', () => {
        test('deve enviar oferta para o caminho correto', async () => {
            const { set, ref } = await import('firebase/database');

            ref.mockReturnValue('mock-offer-ref');
            set.mockResolvedValue(true);

            await service.sendOffer('123456', 'student-1', 'sdp-offer');

            expect(ref).toHaveBeenCalledWith(config.database, 'sessions/123456/offers/student-1');
            expect(set).toHaveBeenCalledWith('mock-offer-ref', 'sdp-offer');
        });
    });

    describe('listenForOffers', () => {
        test('deve retornar função de cleanup', async () => {
            const { ref, onChildAdded, onChildRemoved, off } = await import('firebase/database');

            onChildAdded.mockReturnValue(vi.fn());
            onChildRemoved.mockReturnValue(vi.fn());

            const cleanup = service.listenForOffers('123456', vi.fn(), vi.fn());
            expect(typeof cleanup).toBe('function');

            cleanup();
            expect(off).toHaveBeenCalled();
        });
    });
});
