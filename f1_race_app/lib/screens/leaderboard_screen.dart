import 'package:flutter/material.dart';
import '../api/f1_api.dart';
import '../widgets/state_widgets.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  final api = F1Api();
  bool loading = true;
  String err = "";
  int seasonYear = 2025;
  List<dynamic> rows = [];

  Future<void> load() async {
    try {
      setState(() { loading = true; err = ""; });
      final data = await api.getLeaderboardTeams(seasonYear: seasonYear);
      setState(() { rows = data; });
    } catch (e) {
      setState(() { err = e.toString(); });
    } finally {
      setState(() { loading = false; });
    }
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const LoadingView();
    if (err.isNotEmpty) return ErrorView(message: err, onRetry: load);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              const Text("Season: "),
              const SizedBox(width: 8),
              DropdownButton<int>(
                value: seasonYear,
                items: const [
                  DropdownMenuItem(value: 2024, child: Text("2024")),
                  DropdownMenuItem(value: 2025, child: Text("2025")),
                  DropdownMenuItem(value: 2026, child: Text("2026")),
                ],
                onChanged: (v) {
                  if (v == null) return;
                  setState(() => seasonYear = v);
                  load();
                },
              ),
              const Spacer(),
              IconButton(onPressed: load, icon: const Icon(Icons.refresh))
            ],
          ),
        ),
        Expanded(
          child: ListView.separated(
            itemCount: rows.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final r = rows[i] as Map<String, dynamic>;
              final code = r["teamCode"] ?? "";
              final name = r["teamName"] ?? "";
              final pts = r["totalPoints"] ?? 0;
              final wins = r["wins"] ?? 0;

              return ListTile(
                leading: CircleAvatar(child: Text("${i + 1}")),
                title: Text("$code — $name"),
                subtitle: Text("Wins: $wins"),
                trailing: Text("$pts pts", style: const TextStyle(fontWeight: FontWeight.bold)),
              );
            },
          ),
        ),
      ],
    );
  }
}
