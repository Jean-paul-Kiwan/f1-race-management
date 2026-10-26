import 'package:flutter/material.dart';
import '../api/f1_api.dart';
import '../widgets/state_widgets.dart';

class DriversScreen extends StatefulWidget {
  const DriversScreen({super.key});

  @override
  State<DriversScreen> createState() => _DriversScreenState();
}

class _DriversScreenState extends State<DriversScreen> {
  final api = F1Api();
  bool loading = true;
  String err = "";
  List<dynamic> drivers = [];

  Future<void> load() async {
    try {
      setState(() { loading = true; err = ""; });
      final data = await api.getDrivers();
      setState(() { drivers = data; });
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

    return RefreshIndicator(
      onRefresh: load,
      child: ListView.separated(
        itemCount: drivers.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, i) {
          final d = drivers[i] as Map<String, dynamic>;
          final name = d["fullName"] ?? "Driver";
          final number = d["driverNumber"] ?? "";
          final country = d["country"] ?? "";
          final team = (d["teamId"] is Map) ? (d["teamId"]["code"] ?? "") : "";

          return ListTile(
            title: Text(name),
            subtitle: Text("$team • #$number • $country"),
            trailing: const Icon(Icons.chevron_right),
          );
        },
      ),
    );
  }
}
