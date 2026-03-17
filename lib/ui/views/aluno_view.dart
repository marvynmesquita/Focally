import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:uuid/uuid.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:audioplayers/audioplayers.dart';

import 'package:focally/core/services/signaling_service.dart';
import 'package:focally/core/services/webrtc_service.dart';
import 'package:focally/ui/widgets/sound_wave_visualizer.dart';

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
  final AudioPlayer _noisePlayer = AudioPlayer();
  
  String? _selectedNoise;
  double _noiseVolume = 0.5;
  
  final Map<String, String> _noiseFiles = {
    'White Noise': 'https://raw.githubusercontent.com/marvynmesquita/Focally/main/public/audio/white-noise.mp3',
    'Brown Noise': 'https://raw.githubusercontent.com/marvynmesquita/Focally/main/public/audio/brown-noise.mp3',
    'Pink Noise': 'https://raw.githubusercontent.com/marvynmesquita/Focally/main/public/audio/pink-noise.mp3',
    'Theta Wave': 'https://raw.githubusercontent.com/marvynmesquita/Focally/main/public/audio/theta-wave.mp3',
    'Beta Wave': 'https://raw.githubusercontent.com/marvynmesquita/Focally/main/public/audio/beta-wave.mp3',
  };
  
  @override
  void initState() {
    super.initState();
    print('[Aluno] Iniciando AlunoView com ID: $_studentId');
    _initRenderer();
  }

  Future<void> _initRenderer() async {
    await _audioRenderer.initialize();
  }

  @override
  void dispose() {
    print('[Aluno] Desfazendo AlunoView');
    _webRTCService.dispose();
    _audioRenderer.dispose();
    _noisePlayer.dispose();
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _requestPermissions() async {
    try {
      if (!kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS)) {
         print('[Aluno] Solicitando permissões de Câmera e Microfone (Mobile)');
         await [Permission.camera, Permission.microphone].request();
      }
    } catch (e) {
      print('[Aluno] Erro ao pedir permissões: $e');
    }
  }

  Future<void> _connectToSession(String pin) async {
    if (pin.length != 6) {
       ScaffoldMessenger.of(context).showSnackBar(
         const SnackBar(content: Text('O código deve conter 6 números')),
       );
       return;
    }

    print('[Aluno] Tentando conectar na sala $pin');
    setState(() {
      _isConnecting = true;
      _status = 'Buscando sessão...';
    });

    try {
      await _requestPermissions();

      final exists = await _signalingService.checkSessionExists(pin);
      if (!exists) {
        print('[Aluno] Sessão $pin não encontrada no Firebase');
        setState(() {
          _status = 'Sessão não encontrada.';
          _isConnecting = false;
        });
        return;
      }

      print('[Aluno] Sessão encontrada. Inicializando WebRTC...');
      setState(() => _status = 'Sessão encontrada. Conectando...');

      // Garantir que o áudio vá para o alto-falante (Mobile)
      if (!kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS)) {
         Helper.setSpeakerphoneOn(true);
      }
      
      _webRTCService.onAddStream = (stream) {
        print('[Aluno] Stream de áudio recebida do professor! Tracks: ${stream.getAudioTracks().length}');
        try {
          if (mounted) {
            _audioRenderer.srcObject = stream;
            setState(() => _status = 'Conectado. Ouvindo a transmissão.');
          }
        } catch (e) {
          print('[Aluno] Erro ao setar stream no renderer: $e');
        }
      };

      _webRTCService.onConnectionState = (state) {
        print('[Aluno] Alteração de estado de conexão: $state');
        if (mounted && state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
          setState(() {
            _isConnected = true;
            _status = 'Conectado e recebendo áudio!';
          });
        }
      };

      // Receber os candidados ICE gerados do nosso lado (aluno) e mandar para o professor
      _webRTCService.onIceCandidate = (sid, candidate) {
         _signalingService.addIceCandidate(pin, _studentId, 'professor', candidate);
      };

      // Criar a offer
      final offer = await _webRTCService.createOffer(_studentId);
      
      // Enviar a offer para o professor
      await _signalingService.sendOffer(pin, _studentId, offer);

      // Esperar a answer do professor
      _signalingService.listenForAnswers(pin, _studentId, (answer) async {
        await _webRTCService.setRemoteDescription(_studentId, answer);
      });

      // Aluno escuta ICE do professor pela coleção candidates
      _signalingService.listenForCandidates(pin, 'professor', _studentId, (candidate) {
        _webRTCService.addIceCandidate(_studentId, candidate);
      });

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
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
                // Hidden renderer view to ensure OS audio routing/renderer activity
                SizedBox(
                  width: 1,
                  height: 1,
                  child: RTCVideoView(_audioRenderer),
                ),
                Icon(
                  Icons.hearing,
                  size: 80,
                  color: _isConnected ? Colors.green : Colors.grey,
                ),
                const SizedBox(height: 16),
                SoundWaveVisualizer(
                  isActive: _isConnected,
                  color: Colors.green,
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
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),
                  Text(
                    'Sons de Foco',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: _noiseFiles.keys.map((name) {
                      final isSelected = _selectedNoise == name;
                      return ChoiceChip(
                        label: Text(name),
                        selected: isSelected,
                        onSelected: (selected) async {
                          if (selected) {
                            setState(() => _selectedNoise = name);
                            await _noisePlayer.stop();
                            await _noisePlayer.setSourceUrl(_noiseFiles[name]!);
                            await _noisePlayer.setReleaseMode(ReleaseMode.loop);
                            await _noisePlayer.setVolume(_noiseVolume);
                            await _noisePlayer.resume();
                          } else {
                            setState(() => _selectedNoise = null);
                            await _noisePlayer.stop();
                          }
                        },
                      );
                    }).toList(),
                  ),
                  if (_selectedNoise != null) ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Icon(Icons.volume_down, size: 20),
                        Expanded(
                          child: Slider(
                            value: _noiseVolume,
                            onChanged: (val) {
                              setState(() => _noiseVolume = val);
                              _noisePlayer.setVolume(val);
                            },
                          ),
                        ),
                        const Icon(Icons.volume_up, size: 20),
                      ],
                    ),
                  ],
                  const SizedBox(height: 32),
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
