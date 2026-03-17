import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:focally/core/services/signaling_service.dart';
import 'package:focally/core/services/webrtc_service.dart';
import 'package:focally/utils/session_code.dart';
import 'package:focally/ui/widgets/sound_wave_visualizer.dart';

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

  @override
  void dispose() {
    if (_sessionCode.isNotEmpty) {
      _signalingService.closeSession(_sessionCode);
    }
    _webRTCService.dispose();
    super.dispose();
  }

  Future<void> _startBroadcast() async {
    print('[Professor] Iniciando transmissão...');
    // 1. Pedir permissão de microfone
    try {
      if (!kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS)) {
        print('[Professor] Solicitando permissão de microfone (Mobile)');
        final status = await Permission.microphone.request();
        if (status != PermissionStatus.granted) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Permissão de microfone necessária para o professor.')),
          );
          return;
        }
      } else {
        print('[Professor] Pulando permission_handler (Desktop/Web)');
      }
    } catch (e) {
      print('[Professor] Aviso de permissão: $e');
    }

    setState(() {
      _status = 'Iniciando transmissor...';
      _isBroadcasting = true;
      _sessionCode = SessionCodeUtils.generateCode();
    });

    print('[Professor] Código gerado: $_sessionCode');

    try {
      // Inicializa WebRTC: Professor pega áudio local apenas UMA VEZ
      await _webRTCService.startLocalStream();
      
      // Callbacks ICE (O professor envia candidatos para um aluno específico)
      _webRTCService.onIceCandidate = (studentId, candidate) {
        _signalingService.addIceCandidate(_sessionCode, 'professor', studentId, candidate);
      };

      _webRTCService.onConnectionState = (state) {
        if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
          setState(() => _status = 'Transmitindo áudio...');
        } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateDisconnected) {
          setState(() => _status = 'Aguardando novos alunos...');
        }
      };

      // 2. Criar sessão Firebase
      await _signalingService.createSession(_sessionCode, 'professor');
      
      // 3. Escutar Ofertas de Alunos (1-para-N)
      _signalingService.listenForOffers(_sessionCode, (studentId, offer) async {
        debugPrint('Recebida oferta do aluno: $studentId');
        
        // Professor escuta ICE do aluno direcionado a ele ('professor')
        _signalingService.listenForCandidates(_sessionCode, studentId, 'professor', (candidate) {
          _webRTCService.addIceCandidate(studentId, candidate);
        });

        // Cria e envia answer para este aluno específico
        final answer = await _webRTCService.createAnswerForStudent(studentId, offer);
        await _signalingService.sendAnswer(_sessionCode, studentId, answer);
      });

      setState(() {
        _status = 'Aguardando alunos na sala...';
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
              const SizedBox(height: 16),
              SoundWaveVisualizer(
                isActive: _isBroadcasting,
                color: Colors.redAccent,
              ),
              const SizedBox(height: 16),
              Text(
                _status,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
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
