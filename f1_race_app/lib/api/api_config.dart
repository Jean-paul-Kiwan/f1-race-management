import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show Platform;

class ApiConfig {
  static String get baseUrl {
    // Your backend: http://localhost:5000
    if (kIsWeb) return "http://localhost:5000/api";

    // Android emulator uses 10.0.2.2 to reach your PC localhost
    if (Platform.isAndroid) return "http://10.0.2.2:5000/api";

    // Windows desktop / others
    return "http://127.0.0.1:5000/api";
  }
}
