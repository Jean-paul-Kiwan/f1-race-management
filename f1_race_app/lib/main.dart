import 'package:flutter/material.dart';
import 'package:f1_race_app/screens/home_screen.dart';

void main() {
  runApp(const F1App());
}

class F1App extends StatelessWidget {
  const F1App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'F1 Race Management',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        colorSchemeSeed: Colors.red,
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
