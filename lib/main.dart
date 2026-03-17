import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:focally/firebase_options.dart';
import 'package:focally/ui/views/home_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  runApp(const FocallyApp());
}

class FocallyApp extends StatelessWidget {
  const FocallyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Focally - WebRTC Migration',
      theme: ThemeData(
        brightness: Brightness.light,
        primarySwatch: Colors.blue,
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.blue,
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF121212),
        colorScheme: const ColorScheme.dark(
          primary: Colors.blueAccent,
          surface: Color(0xFF1E1E1E),
        ),
      ),
      themeMode: ThemeMode.system,
      home: const HomeView(),
      debugShowCheckedModeBanner: false,
    );
  }
}
