import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useTeacherBroadcast } from '../../../src/features/teacher/hooks/useTeacherBroadcast';
import { firebaseSignalingService } from '../../../src/core/signaling/FirebaseSignalingService';

vi.mock('../../../src/core/signaling/FirebaseSignalingService', () => ({
    firebaseSignalingService: {
        createSession: vi.fn(),
        listenForOffers: vi.fn(),
        cleanupSession: vi.fn(),
    }
}));

vi.mock('../../../src/core/webrtc/WebRTCService', () => ({
    webRTCService: {
        createPeerConnection: vi.fn()
    }
}));

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
        getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }],
            getAudioTracks: () => [{}]
        })
    },
});

describe('useTeacherBroadcast', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    test('deve inicializar com valores padrão corretos', () => {
        const { result } = renderHook(() => useTeacherBroadcast());
        expect(result.current.status).toBe('Aguardando...');
        expect(result.current.isConnected).toBe(false);
        expect(result.current.sessionCode).toBe('');
    });

    test('deve iniciar transmissão e criar sessão', async () => {
        firebaseSignalingService.createSession.mockResolvedValue();
        firebaseSignalingService.listenForOffers.mockReturnValue(vi.fn());

        const { result } = renderHook(() => useTeacherBroadcast());

        await act(async () => {
            await result.current.startTransmission();
        });

        expect(result.current.sessionCode.length).toBe(6);
        expect(firebaseSignalingService.createSession).toHaveBeenCalled();
        expect(result.current.status).toBe('Aguardando alunos...');
    });

    test('deve limpar recursos corretamente', async () => {
        firebaseSignalingService.cleanupSession.mockResolvedValue();
        const { result } = renderHook(() => useTeacherBroadcast());

        await act(async () => {
            await result.current.cleanup();
        });

        expect(result.current.status).toBe('Aguardando...');
    });
});
