import 'package:flutter/material.dart';
import '../api/f1_api.dart';
import '../widgets/state_widgets.dart';

class RacesScreen extends StatefulWidget {
  const RacesScreen({super.key});

  @override
  State<RacesScreen> createState() => _RacesScreenState();
}

class _RacesScreenState extends State<RacesScreen> {
  final api = F1Api();
  bool loading = true;
  String err = "";
  int seasonYear = 2025;
  List<dynamic> races = [];

  Future<void> load() async {
    try {
      setState(() { loading = true; err = ""; });
      final data = await api.getRaces(seasonYear: seasonYear);
      setState(() { races = data; });
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
            itemCount: races.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final r = races[i] as Map<String, dynamic>;
              final name = r["name"] ?? "Race";
              final circuit = r["circuit"] ?? "";
              final date = (r["raceDate"] ?? "").toString().substring(0, 10);
              final sprint = (r["isSprintWeekend"] == true) ? "Sprint" : "Normal";

              return ListTile(
                title: Text(name),
                subtitle: Text("$circuit • $date • $sprint"),
              );
            },
          ),
        ),
      ],
    );
  }
}
