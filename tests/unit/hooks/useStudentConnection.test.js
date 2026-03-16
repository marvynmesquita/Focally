import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useStudentConnection } from '../../../src/features/student/hooks/useStudentConnection';
import { firebaseSignalingService } from '../../../src/core/signaling/FirebaseSignalingService';

vi.mock('../../../src/core/signaling/FirebaseSignalingService', () => ({
    firebaseSignalingService: {
        sendOffer: vi.fn(),
        listenForAnswer: vi.fn(),
        cleanupOffer: vi.fn(),
    }
}));

vi.mock('../../../src/core/webrtc/WebRTCService', () => ({
    webRTCService: {
        createPeerConnection: vi.fn().mockImplementation(() => {
            let stateChangeHandler = null;
            const pc = {
                addTransceiver: vi.fn(),
                createOffer: vi.fn().mockResolvedValue('mock-offer'),
                setLocalDescription: vi.fn().mockImplementation(async () => {
                    setTimeout(() => {
                        pc.iceGatheringState = 'complete';
                        if (stateChangeHandler) stateChangeHandler();
                    }, 10);
                }),
                setRemoteDescription: vi.fn().mockResolvedValue(),
                localDescription: { sdp: 'mock-sdp' },
                close: vi.fn(),
                iceGatheringState: 'new',
                addEventListener: vi.fn((event, handler) => {
                    if (event === 'icegatheringstatechange') {
                        stateChangeHandler = handler;
                    }
                }),
                removeEventListener: vi.fn((event, handler) => {
                    if (event === 'icegatheringstatechange' && stateChangeHandler === handler) {
                        stateChangeHandler = null;
                    }
                }),
            };
            return pc;
        })
    }
}));

describe('useStudentConnection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('deve inicializar com valores padrão', () => {
        const { result } = renderHook(() => useStudentConnection());
        expect(result.current.status).toBe('Aguardando...');
        expect(result.current.isConnected).toBe(false);
        expect(result.current.sessionCode).toBe('');
    });

    test('deve conectar com código e enviar oferta', async () => {
        firebaseSignalingService.sendOffer.mockResolvedValue();
        firebaseSignalingService.listenForAnswer.mockReturnValue(vi.fn());

        const { result } = renderHook(() => useStudentConnection());

        await act(async () => {
            await result.current.connectWithSessionCode('123456');
        });

        expect(result.current.sessionCode).toBe('123456');
        expect(firebaseSignalingService.sendOffer).toHaveBeenCalled();
        expect(result.current.status).toBe('Oferta enviada, aguardando resposta...');
    });

    test('deve limpar recursos aluno corretamente', async () => {
        firebaseSignalingService.cleanupOffer.mockResolvedValue();
        const { result } = renderHook(() => useStudentConnection());

        await act(async () => {
            await result.current.connectWithSessionCode('123456');
        });

        await act(async () => {
            await result.current.cleanup();
        });

        expect(result.current.status).toBe('Aguardando...');
        expect(result.current.sessionCode).toBe('');
    });
});
