import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';

class F1Api {
  final http.Client _client = http.Client();

  Future<List<dynamic>> getLeaderboardTeams({int seasonYear = 2025}) async {
    final url = Uri.parse("${ApiConfig.baseUrl}/results/leaderboard/teams?seasonYear=$seasonYear");
    final res = await _client.get(url);
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<List<dynamic>> getDrivers() async {
    final url = Uri.parse("${ApiConfig.baseUrl}/drivers");
    final res = await _client.get(url);
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<List<dynamic>> getRaces({int? seasonYear}) async {
    final q = seasonYear == null ? "" : "?seasonYear=$seasonYear";
    final url = Uri.parse("${ApiConfig.baseUrl}/races$q");
    final res = await _client.get(url);
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<List<dynamic>> getResults({String? raceId}) async {
    final q = (raceId == null || raceId.isEmpty) ? "" : "?raceId=$raceId";
    final url = Uri.parse("${ApiConfig.baseUrl}/results$q");
    final res = await _client.get(url);
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<Map<String, dynamic>> createResult(Map<String, dynamic> payload) async {
    final url = Uri.parse("${ApiConfig.baseUrl}/results");
    final res = await _client.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode(payload),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateResult(String id, Map<String, dynamic> payload) async {
    final url = Uri.parse("${ApiConfig.baseUrl}/results/$id");
    final res = await _client.put(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode(payload),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}
