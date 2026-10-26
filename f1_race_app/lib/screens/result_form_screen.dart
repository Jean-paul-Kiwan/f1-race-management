import 'dart:convert';
import 'package:flutter/material.dart';
import '../api/f1_api.dart';

class ResultFormScreen extends StatefulWidget {
  final List<dynamic> races;
  final List<dynamic> drivers;

  // if editing:
  final Map<String, dynamic>? existing; // result object from API (populated)
  const ResultFormScreen({
    super.key,
    required this.races,
    required this.drivers,
    this.existing,
  });

  @override
  State<ResultFormScreen> createState() => _ResultFormScreenState();
}

class _ResultFormScreenState extends State<ResultFormScreen> {
  final api = F1Api();
  bool saving = false;

  String raceId = "";
  String driverId = "";

  final positionCtrl = TextEditingController(text: "1");
  final pointsCtrl = TextEditingController(text: "25");

  bool didNotFinish = false;

  // JSON editors (string)
  late TextEditingController tyreStintsCtrl;
  late TextEditingController penaltiesCtrl;
  late TextEditingController extraDataCtrl;

  @override
  void initState() {
    super.initState();

    // Defaults
    raceId = (widget.races.isNotEmpty) ? (widget.races[0]["_id"] ?? "").toString() : "";
    driverId = (widget.drivers.isNotEmpty) ? (widget.drivers[0]["_id"] ?? "").toString() : "";

    tyreStintsCtrl = TextEditingController(
      text: const JsonEncoder.withIndent("  ").convert([
        {"compound": "SOFT", "laps": 12},
        {"compound": "MEDIUM", "laps": 38},
      ]),
    );
    penaltiesCtrl = TextEditingController(
      text: const JsonEncoder.withIndent("  ").convert([
        {"type": "TRACK_LIMITS", "seconds": 0, "note": "none"}
      ]),
    );
    extraDataCtrl = TextEditingController(
      text: const JsonEncoder.withIndent("  ").convert({"weather": "Dry", "safetyCar": false}),
    );

    // If editing, preload from existing result
    final ex = widget.existing;
    if (ex != null) {
      final exRace = ex["raceId"];
      final exDriver = ex["driverId"];

      raceId = (exRace is Map ? exRace["_id"] : exRace)?.toString() ?? raceId;
      driverId = (exDriver is Map ? exDriver["_id"] : exDriver)?.toString() ?? driverId;

      positionCtrl.text = (ex["position"] ?? 1).toString();
      pointsCtrl.text = (ex["pointsAwarded"] ?? 0).toString();
      didNotFinish = (ex["didNotFinish"] == true);

      tyreStintsCtrl.text = const JsonEncoder.withIndent("  ").convert(ex["tyreStints"] ?? []);
      penaltiesCtrl.text = const JsonEncoder.withIndent("  ").convert(ex["penalties"] ?? []);
      extraDataCtrl.text = const JsonEncoder.withIndent("  ").convert(ex["extraData"] ?? {});
    }
  }

  @override
  void dispose() {
    positionCtrl.dispose();
    pointsCtrl.dispose();
    tyreStintsCtrl.dispose();
    penaltiesCtrl.dispose();
    extraDataCtrl.dispose();
    super.dispose();
  }

  void showErr(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.redAccent),
    );
  }

  Map<String, dynamic> buildPayloadOrThrow() {
    if (raceId.isEmpty) throw Exception("Race is required");
    if (driverId.isEmpty) throw Exception("Driver is required");

    final pos = int.tryParse(positionCtrl.text.trim());
    if (pos == null || pos <= 0) throw Exception("Position must be a valid positive integer");

    final pts = int.tryParse(pointsCtrl.text.trim());
    if (pts == null || pts < 0) throw Exception("Points must be a valid integer");

    // Parse JSON
    final tyreStints = jsonDecode(tyreStintsCtrl.text.trim());
    if (tyreStints is! List) throw Exception("Tyre stints must be a JSON array");

    for (final s in tyreStints) {
      if (s is! Map) throw Exception("Each tyre stint must be an object");
      if (!s.containsKey("compound")) throw Exception("Each tyre stint must have compound");
      if (!s.containsKey("laps")) throw Exception("Each tyre stint must have laps");
    }

    final penalties = jsonDecode(penaltiesCtrl.text.trim());
    if (penalties is! List) throw Exception("Penalties must be a JSON array");

    final extraData = jsonDecode(extraDataCtrl.text.trim());
    if (extraData is! Map) throw Exception("ExtraData must be a JSON object");

    return {
      "raceId": raceId,
      "driverId": driverId,
      "position": pos,
      "pointsAwarded": pts,
      "didNotFinish": didNotFinish,
      "tyreStints": tyreStints,
      "penalties": penalties,
      "extraData": extraData,
    };
  }

  Future<void> save() async {
    try {
      setState(() => saving = true);

      final payload = buildPayloadOrThrow();
      final ex = widget.existing;

      if (ex == null) {
        await api.createResult(payload);
      } else {
        final id = (ex["_id"] ?? "").toString();
        if (id.isEmpty) throw Exception("Missing result id");
        await api.updateResult(id, payload);
      }

      if (!mounted) return;
      Navigator.pop(context, true); // return "changed"
    } catch (e) {
      showErr(e.toString());
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;

    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? "Edit Result" : "Add Result")),
      body: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          const Text("Race"),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: raceId.isEmpty ? null : raceId,
            items: widget.races.map<DropdownMenuItem<String>>((r) {
              final id = (r["_id"] ?? "").toString();
              final name = (r["name"] ?? "Race").toString();
              return DropdownMenuItem<String>(value: id, child: Text(name));
            }).toList(),
            onChanged: (v) => setState(() => raceId = v ?? ""),
          ),
          const SizedBox(height: 14),

          const Text("Driver"),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: driverId.isEmpty ? null : driverId,
            items: widget.drivers.map<DropdownMenuItem<String>>((d) {
              final id = (d["_id"] ?? "").toString();
              final name = (d["fullName"] ?? "Driver").toString();

              String teamCode = "";
              final t = d["teamId"];
              if (t is Map) teamCode = (t["code"] ?? "").toString();

              return DropdownMenuItem<String>(value: id, child: Text("$name ${teamCode.isEmpty ? "" : "($teamCode)"}"));
            }).toList(),
            onChanged: (v) => setState(() => driverId = v ?? ""),
          ),
          const SizedBox(height: 14),

          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: positionCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: "Position (Integer)"),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: pointsCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: "Points Awarded (Max from schema)"),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          SwitchListTile(
            value: didNotFinish,
            onChanged: (v) => setState(() => didNotFinish = v),
            title: const Text("Did Not Finish (Boolean)"),
          ),

          const SizedBox(height: 14),
          const Text("Tyre Stints (Array of objects JSON)"),
          const SizedBox(height: 6),
          TextField(
            controller: tyreStintsCtrl,
            maxLines: 8,
            decoration: const InputDecoration(
              hintText: '[{"compound":"SOFT","laps":12}]',
            ),
          ),

          const SizedBox(height: 14),
          const Text("Penalties (JSON array)"),
          const SizedBox(height: 6),
          TextField(
            controller: penaltiesCtrl,
            maxLines: 6,
            decoration: const InputDecoration(
              hintText: '[{"type":"TRACK_LIMITS","seconds":0,"note":"none"}]',
            ),
          ),

          const SizedBox(height: 14),
          const Text("Extra Data (JSON object)"),
          const SizedBox(height: 6),
          TextField(
            controller: extraDataCtrl,
            maxLines: 5,
            decoration: const InputDecoration(
              hintText: '{"weather":"Dry","safetyCar":false}',
            ),
          ),

          const SizedBox(height: 18),
          FilledButton.icon(
            onPressed: saving ? null : save,
            icon: saving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator()) : const Icon(Icons.save),
            label: Text(saving ? "Saving..." : "Save"),
          ),
          const SizedBox(height: 10),
          const Text(
            "This screen demonstrates Insert/Update in Flutter, while the backend enforces enum/max/validation.",
            style: TextStyle(color: Colors.white60),
          ),
        ],
      ),
    );
  }
}
