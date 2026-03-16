import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:uuid/uuid.dart';

import 'package:focally/core/services/signaling_service.dart';
import 'package:focally/core/services/webrtc_service.dart';
import 'package:focally/utils/session_code.dart';

class ProfessorView extends StatefulWidget {
  const ProfessorView({super.key});

  @override
  State<ProfessorView> createState() => _ProfessorViewState();
}

class _ProfessorViewState extends State<ProfessorView> {
  final _signalingService = SignalingService();
  final _webRTCService = WebRTCService();
  
  String _sessionCode = '';
  String _status = 'Aguardando';
  bool _isBroadcasting = false;
  
  final String _professorId = const Uuid().v4();

  @override
  void dispose() {
    if (_sessionCode.isNotEmpty) {
      _signalingService.closeSession(_sessionCode);
    }
    _webRTCService.dispose();
    super.dispose();
  }

  Future<void> _startBroadcast() async {
    // 1. Pedir permissão de microfone
    final status = await Permission.microphone.request();
    if (status != PermissionStatus.granted) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Permissão de microfone necessária para o professor.')),
      );
      return;
    }

    setState(() {
      _status = 'Iniciando transmissor...';
      _isBroadcasting = true;
      _sessionCode = SessionCodeUtils.generateCode();
    });

    try {
      // Inicializa WebRTC e pega áudio local
      await _webRTCService.initConnection();
      await _webRTCService.startLocalStream();
      
      // Callbacks ICE
      _webRTCService.onIceCandidate = (candidate) {
         // O professor não sabe para quem mandar o ICE até que alguém conecte.
         // Aqui precisaria salvar os candidatos e enviar quando tiver um peer.
         // Mas como a sinalização do Firebase original envia com studentId:
         // Implementamos um callback para processar ICE depois.
      };

      _webRTCService.onConnectionState = (state) {
        if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
          setState(() => _status = 'Conectado. Transmitindo áudio...');
        } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateDisconnected) {
          setState(() => _status = 'Aluno desconectado.');
        } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed) {
          setState(() => _status = 'Falha na conexão.');
        }
      };

      // 2. Criar sessão Firebase
      await _signalingService.createSession(_sessionCode, _professorId);
      
      // 3. Escutar Ofertas de Alunos (Aluno se conecta com offer)
      _signalingService.listenForOffers(_sessionCode, (studentId, offer) async {
        setState(() => _status = 'Aluno conectando...');
        
        // Professor escuta ICE do aluno direcionado a ele
        _signalingService.listenForCandidates(_sessionCode, studentId, _professorId, (candidate) {
          _webRTCService.addIceCandidate(candidate);
        });

        // Professor passa os seus ICE para o aluno
        _webRTCService.onIceCandidate = (candidate) {
          _signalingService.addIceCandidate(_sessionCode, _professorId, studentId, candidate);
        };

        // Cria e envia answer
        final answer = await _webRTCService.createAnswer(offer);
        await _signalingService.sendAnswer(_sessionCode, studentId, answer);
      });

      setState(() {
        _status = 'Aguardando aluno na sala...';
      });

    } catch (e) {
      debugPrint('Error starting broadcast: $e');
      setState(() {
        _status = 'Erro: $e';
        _isBroadcasting = false;
      });
    }
  }

  void _stopBroadcast() {
    if (_sessionCode.isNotEmpty) {
      _signalingService.closeSession(_sessionCode);
    }
    _webRTCService.dispose();
    setState(() {
      _isBroadcasting = false;
      _sessionCode = '';
      _status = 'Parado';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Modo Professor'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.mic,
                size: 80,
                color: _isBroadcasting ? Colors.redAccent : Colors.grey,
              ),
              const SizedBox(height: 24),
              Text(
                _status,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18, color: Colors.black54),
              ),
              const SizedBox(height: 32),
              
              if (_isBroadcasting && _sessionCode.isNotEmpty) ...[
                const Text('Código de Acesso:', style: TextStyle(fontSize: 16)),
                const SizedBox(height: 8),
                Text(
                  _sessionCode,
                  style: const TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 8,
                    color: Colors.blueAccent,
                  ),
                ),
                const SizedBox(height: 32),
                QrImageView(
                  data: _sessionCode,
                  version: QrVersions.auto,
                  size: 200.0,
                  backgroundColor: Colors.white,
                ),
                const SizedBox(height: 48),
                ElevatedButton.icon(
                  onPressed: _stopBroadcast,
                  icon: const Icon(Icons.stop),
                  label: const Text('Encerrar'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(200, 50),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ] else ...[
                ElevatedButton.icon(
                  onPressed: _startBroadcast,
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('Iniciar Transmissão'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueAccent,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(200, 50),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
