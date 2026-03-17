import 'package:flutter/material.dart';
import 'dart:math' as math;

class SoundWaveVisualizer extends StatefulWidget {
  final bool isActive;
  final Color? color;
  
  const SoundWaveVisualizer({
    super.key, 
    required this.isActive,
    this.color,
  });

  @override
  State<SoundWaveVisualizer> createState() => _SoundWaveVisualizerState();
}

class _SoundWaveVisualizerState extends State<SoundWaveVisualizer> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<double> _heights = List.generate(15, (_) => 0.2);
  final math.Random _random = math.Random();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    
    _controller.addListener(_updateHeights);
  }

  void _updateHeights() {
    if (widget.isActive) {
      if (mounted) {
        setState(() {
          for (int i = 0; i < _heights.length; i++) {
            // Cria um efeito de onda senoidal combinada com ruído
            double time = _controller.value * 2 * math.pi;
            double sine = math.sin(time + (i * 0.5));
            _heights[i] = 0.3 + (sine.abs() * 0.4) + (_random.nextDouble() * 0.3);
          }
        });
      }
    } else {
      if (_heights.any((h) => h > 0.1)) {
        if (mounted) {
           setState(() {
            for (int i = 0; i < _heights.length; i++) {
              _heights[i] = 0.1;
            }
          });
        }
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final baseColor = widget.color ?? Colors.blueAccent;
    
    return SizedBox(
      height: 60,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: List.generate(_heights.length, (index) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 4,
              height: 50 * _heights[index],
              decoration: BoxDecoration(
                gradient: widget.isActive ? LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    baseColor.withOpacity(0.7),
                    baseColor,
                    baseColor.withOpacity(0.7),
                  ],
                ) : null,
                color: widget.isActive ? null : Colors.grey.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
                boxShadow: widget.isActive ? [
                  BoxShadow(
                    color: baseColor.withOpacity(0.3),
                    blurRadius: 4,
                    spreadRadius: 1,
                  )
                ] : null,
              ),
            ),
          );
        }),
      ),
    );
  }
}
