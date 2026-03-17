import 'package:firebase_database/firebase_database.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class SignalingService {
  final FirebaseDatabase _db = FirebaseDatabase.instance;

  // Criar uma sessão como professor
  Future<void> createSession(String pin, String professorId) async {
    print('[Signaling] Criando sessão $pin para professor $professorId');
    final sessionRef = _db.ref('sessions/$pin');
    await sessionRef.set({
      'professorId': professorId,
      'status': 'active',
      'createdAt': ServerValue.timestamp,
    });
    
    // Limpar offers e answers antigos
    print('[Signaling] Limpando dados antigos da sessão $pin');
    await _db.ref('offers/$pin').remove();
    await _db.ref('answers/$pin').remove();
    await _db.ref('candidates/$pin').remove();
  }

  // Verificar se uma sessão existe
  Future<bool> checkSessionExists(String pin) async {
    print('[Signaling] Verificando existência da sessão $pin');
    final snapshot = await _db.ref('sessions/$pin').get();
    return snapshot.exists;
  }

  // Professor escuta por novas ofertas de alunos
  void listenForOffers(String pin, Function(String studentId, RTCSessionDescription offer) onOffer) {
    print('[Signaling] Escutando ofertas na sala $pin');
    _db.ref('offers/$pin').onChildAdded.listen((event) {
      if (event.snapshot.value == null) return;
      final studentId = event.snapshot.key!;
      final data = Map<String, dynamic>.from(event.snapshot.value as Map);
      
      print('[Signaling] Nova oferta recebida de $studentId');
      final offer = RTCSessionDescription(data['sdp'], data['type']);
      onOffer(studentId, offer);
    });
  }

  // Aluno envia a oferta para a sessão
  Future<void> sendOffer(String pin, String studentId, RTCSessionDescription offer) async {
    print('[Signaling] Aluno $studentId enviando oferta para $pin');
    await _db.ref('offers/$pin/$studentId').set({
      'type': offer.type,
      'sdp': offer.sdp,
    });
  }

  // Professor envia a resposta para o aluno
  Future<void> sendAnswer(String pin, String studentId, RTCSessionDescription answer) async {
    print('[Signaling] Professor enviando resposta para aluno $studentId na sala $pin');
    await _db.ref('answers/$pin/$studentId').set({
      'type': answer.type,
      'sdp': answer.sdp,
    });
  }

  // Aluno escuta pela resposta do professor
  void listenForAnswers(String pin, String studentId, Function(RTCSessionDescription answer) onAnswer) {
    print('[Signaling] Aluno $studentId escutando por respostas na sala $pin');
    _db.ref('answers/$pin/$studentId').onValue.listen((event) {
      if (event.snapshot.value == null) return;
      final data = Map<String, dynamic>.from(event.snapshot.value as Map);
      
      print('[Signaling] Resposta recebida para o aluno $studentId');
      final answer = RTCSessionDescription(data['sdp'], data['type']);
      onAnswer(answer);
    });
  }

  // Adicionar ICE Candidate
  Future<void> addIceCandidate(String pin, String senderId, String targetId, RTCIceCandidate? candidate) async {
    if (candidate == null) {
      print('[Signaling] Candidate nulo recebido (Gathering complete). Ignorando.');
      return;
    }
    print('[Signaling] Adicionando candidate de $senderId para $targetId');
    await _db.ref('candidates/$pin/${senderId}_to_$targetId').push().set({
      'candidate': candidate.candidate,
      'sdpMid': candidate.sdpMid,
      'sdpMLineIndex': candidate.sdpMLineIndex,
    });
  }

  // Escutar ICE Candidates
  void listenForCandidates(String pin, String senderId, String targetId, Function(RTCIceCandidate candidate) onCandidate) {
    print('[Signaling] Escutando candidates de $senderId para $targetId');
    _db.ref('candidates/$pin/${senderId}_to_$targetId').onChildAdded.listen((event) {
      if (event.snapshot.value == null) return;
      final data = Map<String, dynamic>.from(event.snapshot.value as Map);
      
      print('[Signaling] Novo candidate recebido de $senderId para $targetId');
      final candidate = RTCIceCandidate(
        data['candidate'],
        data['sdpMid'],
        data['sdpMLineIndex'],
      );
      onCandidate(candidate);
    });
  }

  // Finalizar a sessão (Professor)
  Future<void> closeSession(String pin) async {
    print('[Signaling] Encerrando sessão $pin');
    await _db.ref('sessions/$pin').remove();
    await _db.ref('offers/$pin').remove();
    await _db.ref('answers/$pin').remove();
    await _db.ref('candidates/$pin').remove();
  }
}
