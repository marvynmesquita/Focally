import 'dart:math';

class SessionCodeUtils {
  static String generateCode() {
    final rand = Random();
    String code = '';
    for (int i = 0; i < 6; i++) {
        code += rand.nextInt(10).toString();
    }
    return code;
  }
}
