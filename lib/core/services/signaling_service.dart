import 'package:firebase_database/firebase_database.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class SignalingService {
  final FirebaseDatabase _db = FirebaseDatabase.instance;

  // Criar uma sessão como professor
  Future<void> createSession(String pin, String professorId) async {
    final sessionRef = _db.ref('sessions/$pin');
    await sessionRef.set({
      'professorId': professorId,
      'status': 'active',
      'createdAt': ServerValue.timestamp,
    });
    
    // Limpar offers e answers antigos
    await _db.ref('offers/$pin').remove();
    await _db.ref('answers/$pin').remove();
    await _db.ref('candidates/$pin').remove();
  }

  // Verificar se uma sessão existe
  Future<bool> checkSessionExists(String pin) async {
    final snapshot = await _db.ref('sessions/$pin').get();
    return snapshot.exists;
  }

  // Professor escuta por novas ofertas de alunos
  void listenForOffers(String pin, Function(String studentId, RTCSessionDescription offer) onOffer) {
    _db.ref('offers/$pin').onChildAdded.listen((event) {
      if (event.snapshot.value == null) return;
      final studentId = event.snapshot.key!;
      final data = Map<String, dynamic>.from(event.snapshot.value as Map);
      
      final offer = RTCSessionDescription(data['sdp'], data['type']);
      onOffer(studentId, offer);
    });
  }

  // Aluno envia a oferta para a sessão
  Future<void> sendOffer(String pin, String studentId, RTCSessionDescription offer) async {
    await _db.ref('offers/$pin/$studentId').set({
      'type': offer.type,
      'sdp': offer.sdp,
    });
  }

  // Professor envia a resposta para o aluno
  Future<void> sendAnswer(String pin, String studentId, RTCSessionDescription answer) async {
    await _db.ref('answers/$pin/$studentId').set({
      'type': answer.type,
      'sdp': answer.sdp,
    });
  }

  // Aluno escuta pela resposta do professor
  void listenForAnswers(String pin, String studentId, Function(RTCSessionDescription answer) onAnswer) {
    _db.ref('answers/$pin/$studentId').onValue.listen((event) {
      if (event.snapshot.value == null) return;
      final data = Map<String, dynamic>.from(event.snapshot.value as Map);
      
      final answer = RTCSessionDescription(data['sdp'], data['type']);
      onAnswer(answer);
    });
  }

  // Adicionar ICE Candidate
  Future<void> addIceCandidate(String pin, String senderId, String targetId, RTCIceCandidate candidate) async {
    await _db.ref('candidates/$pin/${senderId}_to_$targetId').push().set({
      'candidate': candidate.candidate,
      'sdpMid': candidate.sdpMid,
      'sdpMLineIndex': candidate.sdpMLineIndex,
    });
  }

  // Escutar ICE Candidates
  void listenForCandidates(String pin, String senderId, String targetId, Function(RTCIceCandidate candidate) onCandidate) {
    // Nós escutamos as mensagens onde o targetId somos nós e o senderId é a outra parte
    // Ex: professor escuta de student_to_professor
    _db.ref('candidates/$pin/${senderId}_to_$targetId').onChildAdded.listen((event) {
      if (event.snapshot.value == null) return;
      final data = Map<String, dynamic>.from(event.snapshot.value as Map);
      
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
    await _db.ref('sessions/$pin').remove();
    await _db.ref('offers/$pin').remove();
    await _db.ref('answers/$pin').remove();
    await _db.ref('candidates/$pin').remove();
  }
}
