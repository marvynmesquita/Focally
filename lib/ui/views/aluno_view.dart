import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:uuid/uuid.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'package:focally/core/services/signaling_service.dart';
import 'package:focally/core/services/webrtc_service.dart';

class AlunoView extends StatefulWidget {
  const AlunoView({super.key});

  @override
  State<AlunoView> createState() => _AlunoViewState();
}

class _AlunoViewState extends State<AlunoView> {
  final _signalingService = SignalingService();
  final _webRTCService = WebRTCService();
  
  final TextEditingController _pinController = TextEditingController();
  final String _studentId = const Uuid().v4();
  
  String _status = 'Digite o código da sessão ou use o QR Code';
  bool _isConnected = false;
  bool _isConnecting = false;
  bool _isScanning = false;
  
  final RTCVideoRenderer _audioRenderer = RTCVideoRenderer();
  
  @override
  void initState() {
    super.initState();
    _initRenderer();
  }

  Future<void> _initRenderer() async {
    await _audioRenderer.initialize();
  }

  @override
  void dispose() {
    if (_isConnected) {
      _webRTCService.dispose();
    }
    _audioRenderer.dispose();
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _connectToSession(String pin) async {
    if (pin.length != 6) {
       ScaffoldMessenger.of(context).showSnackBar(
         const SnackBar(content: Text('O código deve conter 6 números')),
       );
       return;
    }

    setState(() {
      _isConnecting = true;
      _status = 'Buscando sessão...';
    });

    try {
      final exists = await _signalingService.checkSessionExists(pin);
      if (!exists) {
        setState(() {
          _status = 'Sessão não encontrada.';
          _isConnecting = false;
        });
        return;
      }

      setState(() => _status = 'Sessão encontrada. Conectando...');

      await _webRTCService.initConnection();
      
      _webRTCService.onAddStream = (stream) {
        _audioRenderer.srcObject = stream;
        setState(() => _status = 'Conectado. Ouvindo a transmissão.');
      };

      _webRTCService.onConnectionState = (state) {
        if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
          setState(() {
            _isConnected = true;
            _status = 'Conectado e recebendo áudio!';
          });
        }
      };

      // Receber os candidados ICE gerados do nosso lado (aluno) e mandar para o professor
      // Sabemos o ID do professor porque na sinalização do projeto React,
      // ele pega o professorId salvo dentro de sessions/pin/professorId,
      // mas vamos mandar sem ID especifico para simplify, enviando na offer e candidates diretos
      
      // Criar a offer
      final offer = await _webRTCService.createOffer();
      
      // Enviar a offer para o professor
      await _signalingService.sendOffer(pin, _studentId, offer);

      // Esperar a answer do professor
      _signalingService.listenForAnswers(pin, _studentId, (answer) async {
        await _webRTCService.setRemoteDescription(answer);
      });

      // No react: o aluno escuta ICE do professor pela coleção candidates
      // Precisamos pegar o professorId de dentro de sessions/$pin/professorId
      // Para simular, vamos ignorar a complexidade do senderId e escutar
      _webRTCService.onIceCandidate = (candidate) {
         // O Aluno envia ICE para a Firebase do Professor
         // No firebase JS original os candidates não especificavam alvo
         _signalingService.addIceCandidate(pin, _studentId, 'professor', candidate);
      };

    } catch (e) {
      debugPrint('Error connecting: $e');
      setState(() {
         _status = 'Erro ao conectar: $e';
         _isConnecting = false;
      });
    }
  }

  void _disconnect() {
    _webRTCService.dispose();
    setState(() {
      _isConnected = false;
      _isConnecting = false;
      _status = 'Desconectado.';
      _audioRenderer.srcObject = null;
    });
  }

  void _toggleScanner() {
    setState(() {
      _isScanning = !_isScanning;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Modo Aluno'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
               Icon(
                 Icons.hearing,
                 size: 80,
                 color: _isConnected ? Colors.green : Colors.grey,
               ),
               const SizedBox(height: 16),
               Text(
                 _status,
                 textAlign: TextAlign.center,
                 style: const TextStyle(fontSize: 16, color: Colors.black54),
               ),
               const SizedBox(height: 32),

               if (!_isConnected && !_isConnecting) ...[
                 if (_isScanning)
                   SizedBox(
                     height: 300,
                     child: MobileScanner(
                       onDetect: (capture) {
                         final List<Barcode> barcodes = capture.barcodes;
                         for (final barcode in barcodes) {
                           if (barcode.rawValue != null) {
                             final code = barcode.rawValue!;
                             if (code.length == 6) {
                               _pinController.text = code;
                               _toggleScanner();
                               _connectToSession(code);
                               break;
                             }
                           }
                         }
                       },
                     ),
                   )
                 else ...[
                   TextField(
                     controller: _pinController,
                     keyboardType: TextInputType.number,
                     textAlign: TextAlign.center,
                     maxLength: 6,
                     style: const TextStyle(fontSize: 32, letterSpacing: 8),
                     decoration: const InputDecoration(
                       hintText: '000000',
                       border: OutlineInputBorder(),
                     ),
                   ),
                   const SizedBox(height: 16),
                   Row(
                     mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                     children: [
                       ElevatedButton.icon(
                         onPressed: () => _connectToSession(_pinController.text),
                         icon: const Icon(Icons.login),
                         label: const Text('Conectar'),
                         style: ElevatedButton.styleFrom(
                           backgroundColor: Colors.blueAccent,
                           foregroundColor: Colors.white,
                           minimumSize: const Size(140, 50),
                         ),
                       ),
                       OutlinedButton.icon(
                         onPressed: _toggleScanner,
                         icon: const Icon(Icons.qr_code_scanner),
                         label: const Text('QR Code'),
                         style: OutlinedButton.styleFrom(
                           minimumSize: const Size(140, 50),
                         ),
                       ),
                     ],
                   ),
                 ],
               ] else if (_isConnecting && !_isConnected) ...[
                 const Center(child: CircularProgressIndicator()),
               ] else ...[
                 // Reprodução do áudio é via _audioRenderer
                 ElevatedButton.icon(
                   onPressed: _disconnect,
                   icon: const Icon(Icons.exit_to_app),
                   label: const Text('Desconectar'),
                   style: ElevatedButton.styleFrom(
                     backgroundColor: Colors.redAccent,
                     foregroundColor: Colors.white,
                     minimumSize: const Size(200, 50),
                   ),
                 ),
               ]
            ],
          ),
        ),
      ),
    );
  }
}
