import 'package:flutter_webrtc/flutter_webrtc.dart';

class WebRTCService {
  final Map<String, RTCPeerConnection> _peerConnections = {};
  MediaStream? _localStream;
  
  // Callbacks
  Function(String studentId, RTCIceCandidate candidate)? onIceCandidate;
  Function(MediaStream stream)? onAddStream;
  Function(RTCPeerConnectionState state)? onConnectionState;
  
  final Map<String, dynamic> _configuration = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
      {'urls': 'stun:stun2.l.google.com:19302'},
    ],
    'sdpSemantics': 'unified-plan',
  };

  final Map<String, dynamic> _offerSdpConstraints = {
    'mandatory': {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': false,
    },
    'optional': [],
  };

  // 1. Professor captura áudio do microfone (apenas uma vez)
  Future<void> startLocalStream() async {
    try {
      if (_localStream != null) {
        print('[WebRTC] Local stream já existe, pulando captura');
        return;
      }
      
      final Map<String, dynamic> mediaConstraints = {
        'audio': true,
        'video': false,
      };

      print('[WebRTC] Capturando microfone...');
      _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      print('[WebRTC] Microfone capturado com sucesso');
    } catch (e) {
      print('[WebRTC] Erro capturando áudio: $e');
      rethrow;
    }
  }

  // 2. Criar conexão para um aluno específico (Modo Professor)
  Future<RTCPeerConnection> createPeerConnectionForStudent(String studentId) async {
    print('[WebRTC] Criando PC para o aluno: $studentId');
    // Se já existe, fecha a antiga
    if (_peerConnections.containsKey(studentId)) {
      print('[WebRTC] Fechando conexão antiga para $studentId');
      await _peerConnections[studentId]!.close();
      await _peerConnections[studentId]!.dispose();
    }

    RTCPeerConnection pc = await createPeerConnection(_configuration, _offerSdpConstraints);
    _peerConnections[studentId] = pc;

    pc.onIceCandidate = (RTCIceCandidate candidate) {
      print('[WebRTC] Novo ICE gerado para o aluno $studentId');
      if (onIceCandidate != null) {
        onIceCandidate!(studentId, candidate);
      }
    };

    pc.onConnectionState = (RTCPeerConnectionState state) {
      print('[WebRTC] PC [$studentId] State changed: $state');
      if (onConnectionState != null) {
        onConnectionState!(state);
      }
    };

    pc.onIceGatheringState = (RTCIceGatheringState state) {
      print('[WebRTC] PC [$studentId] ICE Gathering State: $state');
    };

    // Injeta a trilha de áudio local se disponível
    if (_localStream != null) {
      print('[WebRTC] Injetando track de áudio no PC de $studentId');
      for (var track in _localStream!.getTracks()) {
        print('[WebRTC] Adicionando track: ${track.kind} (id: ${track.id}, enabled: ${track.enabled})');
        track.enabled = true; // Forçar ativação
        await pc.addTrack(track, _localStream!);
      }
    }

    return pc;
  }

  // Aluno cria a oferta inicial (Modo Aluno - conexao única)
  Future<RTCSessionDescription> createOffer(String studentId) async {
    print('[WebRTC] Aluno $studentId criando oferta');
    RTCPeerConnection pc = await createPeerConnection(_configuration, _offerSdpConstraints);
    _peerConnections[studentId] = pc;

    pc.onIceCandidate = (RTCIceCandidate candidate) {
      print('[WebRTC] Aluno $studentId gerou ICE');
      if (onIceCandidate != null) {
        onIceCandidate!(studentId, candidate);
      }
    };

    pc.onTrack = (RTCTrackEvent event) {
      print('[WebRTC] Aluno recebeu track remota!');
      if (event.streams.isNotEmpty && onAddStream != null) {
        onAddStream!(event.streams[0]);
      }
    };

    pc.onConnectionState = (RTCPeerConnectionState state) {
      print('[WebRTC] Aluno Connection State: $state');
      if (onConnectionState != null) {
        onConnectionState!(state);
      }
    };

    RTCSessionDescription offer = await pc.createOffer(_offerSdpConstraints);
    print('[WebRTC] Oferta criada, setando LocalDescription');
    await pc.setLocalDescription(offer);
    return offer;
  }

  // Professor cria a resposta para a oferta de um aluno específico
  Future<RTCSessionDescription> createAnswerForStudent(String studentId, RTCSessionDescription offer) async {
    print('[WebRTC] Professor criando resposta para $studentId');
    RTCPeerConnection pc = await createPeerConnectionForStudent(studentId);
    
    print('[WebRTC] Setando RemoteDescription (Offer) para $studentId');
    await pc.setRemoteDescription(offer);
    
    print('[WebRTC] Criando Answer');
    RTCSessionDescription answer = await pc.createAnswer(_offerSdpConstraints);
    
    print('[WebRTC] Setando LocalDescription (Answer) para $studentId');
    await pc.setLocalDescription(answer);
    
    return answer;
  }

  // Setar descrição remota (Usado pelo aluno ou professor)
  Future<void> setRemoteDescription(String studentId, RTCSessionDescription description) async {
    print('[WebRTC] [$studentId] Setando RemoteDescription do tipo ${description.type}');
    final pc = _peerConnections[studentId];
    if (pc == null) throw Exception("Conexão não encontrada para $studentId");
    await pc.setRemoteDescription(description);
  }

  // Adicionar IceCandidate vindo remoto
  Future<void> addIceCandidate(String studentId, RTCIceCandidate candidate) async {
    print('[WebRTC] [$studentId] Adicionando candidate remoto');
    final pc = _peerConnections[studentId];
    if (pc == null) {
      print("[WebRTC] Aviso: Recebido ICE para $studentId mas PC ainda não existe.");
      return;
    }
    await pc.addCandidate(candidate);
  }

  // Finalizar
  Future<void> dispose() async {
    print('[WebRTC] Descartando WebRTCService');
    if (_localStream != null) {
      for (var track in _localStream!.getTracks()) {
        track.stop();
      }
      await _localStream!.dispose();
      _localStream = null;
    }

    for (var pc in _peerConnections.values) {
      await pc.close();
      await pc.dispose();
    }
    _peerConnections.clear();
  }
}
