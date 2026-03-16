import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:flutter/foundation.dart';

class WebRTCService {
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  MediaStream? _remoteStream;
  
  // Callbacks
  Function(RTCIceCandidate candidate)? onIceCandidate;
  Function(MediaStream stream)? onAddStream;
  Function(RTCPeerConnectionState state)? onConnectionState;
  
  final Map<String, dynamic> _configuration = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
      {'urls': 'stun:stun2.l.google.com:19302'},
    ]
  };

  final Map<String, dynamic> _offerSdpConstraints = {
    'mandatory': {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': false,
    },
    'optional': [],
  };

  // 1. Inicializar
  Future<void> initConnection() async {
    _peerConnection = await createPeerConnection(_configuration, _offerSdpConstraints);

    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      if (onIceCandidate != null) {
        onIceCandidate!(candidate);
      }
    };

    _peerConnection!.onConnectionState = (RTCPeerConnectionState state) {
      if (onConnectionState != null) {
        onConnectionState!(state);
      }
    };

    _peerConnection!.onTrack = (RTCTrackEvent event) {
      if (event.streams.isNotEmpty) {
        if (_remoteStream == null) {
          _remoteStream = event.streams[0];
          if (onAddStream != null) {
            onAddStream!(_remoteStream!);
          }
        }
      }
    };
  }

  // 2. Professor captura áudio do microfone (apenas áudio)
  Future<void> startLocalStream() async {
    try {
      final Map<String, dynamic> mediaConstraints = {
        'audio': true,
        'video': false,
      };

      _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      if (_peerConnection != null && _localStream != null) {
        _localStream!.getTracks().forEach((track) {
          _peerConnection!.addTrack(track, _localStream!);
        });
      }
    } catch (e) {
      debugPrint("Erro capturando áudio: $e");
      rethrow;
    }
  }

  // Aluno cria a oferta para consumir o áudio
  Future<RTCSessionDescription> createOffer() async {
    if (_peerConnection == null) throw Exception("Conexão não inicializada");

    RTCSessionDescription offer = await _peerConnection!.createOffer(_offerSdpConstraints);
    await _peerConnection!.setLocalDescription(offer);
    return offer;
  }

  // Professor cria a resposta para a oferta do aluno e envia a sua stream local
  Future<RTCSessionDescription> createAnswer(RTCSessionDescription offer) async {
    if (_peerConnection == null) throw Exception("Conexão não inicializada");

    await _peerConnection!.setRemoteDescription(offer);
    
    // Assegura que o stream local seja injetado antes da resposta
    if (_localStream != null) {
        _localStream!.getTracks().forEach((track) {
          _peerConnection!.addTrack(track, _localStream!);
        });
    }

    RTCSessionDescription answer = await _peerConnection!.createAnswer(_offerSdpConstraints);
    await _peerConnection!.setLocalDescription(answer);
    
    return answer;
  }

  // Setar descrição remota (Usado pelo aluno ao receber a resposta do professor)
  Future<void> setRemoteDescription(RTCSessionDescription description) async {
    if (_peerConnection == null) throw Exception("Conexão não inicializada");
    await _peerConnection!.setRemoteDescription(description);
  }

  // Adicionar IceCandidate vindo remoto
  Future<void> addIceCandidate(RTCIceCandidate candidate) async {
    if (_peerConnection == null) throw Exception("Conexão não inicializada");
    await _peerConnection!.addCandidate(candidate);
  }

  // Finalizar
  Future<void> dispose() async {
    if (_localStream != null) {
      for (var track in _localStream!.getTracks()) {
        track.stop();
      }
      await _localStream!.dispose();
      _localStream = null;
    }

    if (_remoteStream != null) {
      await _remoteStream!.dispose();
      _remoteStream = null;
    }

    if (_peerConnection != null) {
      await _peerConnection!.close();
      await _peerConnection!.dispose();
      _peerConnection = null;
    }
  }
}
