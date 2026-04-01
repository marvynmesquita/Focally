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
        onChildRemoved: vi.fn(),
        runTransaction: vi.fn()
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
            const { ref, runTransaction } = await import('firebase/database');

            ref.mockReturnValue('mock-ref');
            runTransaction.mockResolvedValue({ committed: true });

            await service.createSession('12345678');

            expect(ref).toHaveBeenCalledWith(config.database, 'sessions/12345678');
            expect(runTransaction).toHaveBeenCalledWith(
                'mock-ref',
                expect.any(Function),
                { applyLocally: false }
            );
        });

        test('deve lançar erro se Firebase não configurado', async () => {
            config.isFirebaseConfigured = false;
            await expect(service.createSession('12345678')).rejects.toThrow('Firebase não está configurado');
            config.isFirebaseConfigured = true; // reset
        });
    });

    describe('sendOffer', () => {
        test('deve enviar oferta para o caminho correto', async () => {
            const { set, ref } = await import('firebase/database');

            ref.mockReturnValue('mock-offer-ref');
            set.mockResolvedValue(true);

            await service.sendOffer('12345678', 'student-1', 'v=0\r\no=offer');

            expect(ref).toHaveBeenCalledWith(config.database, 'sessions/12345678/offers/student-1');
            expect(set).toHaveBeenCalledWith('mock-offer-ref', 'v=0\r\no=offer');
        });
    });

    describe('listenForOffers', () => {
        test('deve retornar função de cleanup', async () => {
            const { ref, onChildAdded, onChildRemoved, off } = await import('firebase/database');

            onChildAdded.mockReturnValue(vi.fn());
            onChildRemoved.mockReturnValue(vi.fn());

            const cleanup = service.listenForOffers('12345678', vi.fn(), vi.fn());
            expect(typeof cleanup).toBe('function');

            cleanup();
            expect(off).toHaveBeenCalled();
        });
    });
});
