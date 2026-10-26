import 'package:flutter/material.dart';
import 'leaderboard_screen.dart';
import 'drivers_screen.dart';
import 'races_screen.dart';
import 'results_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int idx = 0;

  final pages = const [
    LeaderboardScreen(),
    DriversScreen(),
    RacesScreen(),
    ResultsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("F1 Race Management"),
      ),
      body: pages[idx],
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
        onDestinationSelected: (v) => setState(() => idx = v),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.emoji_events), label: "Leaderboard"),
          NavigationDestination(icon: Icon(Icons.person), label: "Drivers"),
          NavigationDestination(icon: Icon(Icons.flag), label: "Races"),
          NavigationDestination(icon: Icon(Icons.table_chart), label: "Results"),
        ],
      ),
    );
  }
}
