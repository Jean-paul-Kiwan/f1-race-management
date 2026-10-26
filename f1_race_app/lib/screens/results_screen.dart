import 'package:flutter/material.dart';
import '../api/f1_api.dart';
import '../widgets/state_widgets.dart';
import 'result_form_screen.dart';

class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key});

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  final api = F1Api();
  bool loading = true;
  String err = "";

  List<dynamic> races = [];
  List<dynamic> drivers = [];

  String raceId = "";
  List<dynamic> results = [];

  Future<void> load() async {
    try {
      setState(() {
        loading = true;
        err = "";
      });

      // Load races + drivers for dropdowns + forms
      final data = await Future.wait([
        api.getRaces(seasonYear: 2025),
        api.getDrivers(),
      ]);

      races = data[0] as List<dynamic>;
      drivers = data[1] as List<dynamic>;

      // default race filter
      raceId = raceId.isEmpty && races.isNotEmpty ? (races[0]["_id"] ?? "").toString() : raceId;

      final resu = await api.getResults(raceId: raceId);
      setState(() {
        results = resu;
      });
    } catch (e) {
      setState(() {
        err = e.toString();
      });
    } finally {
      setState(() {
        loading = false;
      });
    }
  }

  Future<void> openAdd() async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => ResultFormScreen(
          races: races,
          drivers: drivers,
        ),
      ),
    );

    if (changed == true) {
      await load();
    }
  }

  Future<void> openEdit(Map<String, dynamic> result) async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => ResultFormScreen(
          races: races,
          drivers: drivers,
          existing: result,
        ),
      ),
    );

    if (changed == true) {
      await load();
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

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: openAdd,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                const Text("Race: "),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButton<String>(
                    isExpanded: true,
                    value: raceId.isEmpty ? null : raceId,
                    items: races.map<DropdownMenuItem<String>>((r) {
                      final id = (r["_id"] ?? "").toString();
                      final name = (r["name"] ?? "Race").toString();
                      return DropdownMenuItem<String>(value: id, child: Text(name));
                    }).toList(),
                    onChanged: (v) async {
                      if (v == null) return;
                      setState(() => raceId = v);
                      await load();
                    },
                  ),
                ),
                IconButton(onPressed: load, icon: const Icon(Icons.refresh))
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              itemCount: results.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final r = results[i] as Map<String, dynamic>;
                final pos = r["position"] ?? "";
                final pts = r["pointsAwarded"] ?? 0;

                final driver = (r["driverId"] is Map) ? (r["driverId"]["fullName"] ?? "") : "";
                final team = (r["driverId"] is Map && r["driverId"]["teamId"] is Map)
                    ? (r["driverId"]["teamId"]["code"] ?? "")
                    : "";

                String stints = "";
                if (r["tyreStints"] is List) {
                  stints = (r["tyreStints"] as List)
                      .map((s) => "${s["compound"]}(${s["laps"]})")
                      .join(", ");
                }

                return ListTile(
                  onTap: () => openEdit(r),
                  leading: CircleAvatar(child: Text("$pos")),
                  title: Text("$driver • $team"),
                  subtitle: Text(stints.isEmpty ? "No stints" : stints),
                  trailing: Text("$pts pts", style: const TextStyle(fontWeight: FontWeight.bold)),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
