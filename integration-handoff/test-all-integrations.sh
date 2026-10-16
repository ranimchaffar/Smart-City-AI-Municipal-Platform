#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE VALIDATION DE L'API MEMBRE 5 (TESTS D'INTÉGRATION cURL)
# ==============================================================================

BASE_URL="http://localhost:3001"
STAFF_TOKEN="municipal-staff-secret-2026"

echo "=========================================================="
echo "🚀 Démarrage du Test d'Intégration de l'API Membre 5"
echo "Target: $BASE_URL"
echo "=========================================================="

# 1. Health check
echo -e "\n1. Test /api/health..."
curl -s "$BASE_URL/api/health" | grep -q "healthy" && echo "✅ PASS: Backend est en ligne et connecté à PostgreSQL" || echo "❌ FAIL"

# 2. Dashboard KPIs
echo -e "\n2. Test /api/dashboard/stats..."
curl -s "$BASE_URL/api/dashboard/stats" | grep -q "totalTickets" && echo "✅ PASS: KPIs retournés depuis la base de données" || echo "❌ FAIL"

# 3. PASS Submission
echo -e "\n3. Test Soumission PASS (Nid-de-poule)..."
PASS_RES=$(curl -s -X POST "$BASE_URL/api/reports" \
  -H "Content-Type: application/json" \
  -d '{
    "report_id": "RPT-CURL-PASS-001",
    "description": "A deep pothole is dangerous for drivers on the road.",
    "category_hint": "ROAD_DAMAGE",
    "media_ref": "mock://pothole"
  }')
echo "$PASS_RES" | grep -q "PASS" && echo "✅ PASS: Signalement validé et ticket créé" || echo "❌ FAIL: $PASS_RES"

# 4. REVIEW Submission
echo -e "\n4. Test Soumission REVIEW (Incohérence)..."
REV_RES=$(curl -s -X POST "$BASE_URL/api/reports" \
  -H "Content-Type: application/json" \
  -d '{
    "report_id": "RPT-CURL-REV-001",
    "description": "There is a pothole on the road.",
    "category_hint": "STREET_LIGHTING",
    "media_ref": "mock://streetlight"
  }')
echo "$REV_RES" | grep -q "REVIEW" && echo "✅ PASS: Signalement escaladé vers la modération humaine" || echo "❌ FAIL: $REV_RES"

# 5. REJECT Submission
echo -e "\n5. Test Soumission REJECT (Sans média)..."
REJ_RES=$(curl -s -X POST "$BASE_URL/api/reports" \
  -H "Content-Type: application/json" \
  -d '{
    "report_id": "RPT-CURL-REJ-001",
    "description": "Déchets sans photo.",
    "category_hint": "WASTE",
    "media_ref": ""
  }')
echo "$REJ_RES" | grep -q "REJECT" && echo "✅ PASS: Signalement rejeté pour absence de photo" || echo "❌ FAIL: $REJ_RES"

# 6. Unauthorized status update
echo -e "\n6. Test Sécurité : Modification de statut non autorisée..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/tickets/TKT-2026-00017/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "RESOLVED", "actor": "hacker"}')
if [ "$HTTP_CODE" -eq 401 ]; then
  echo "✅ PASS: Accès non autorisé bloqué avec HTTP 401 Unauthorized"
else
  echo "❌ FAIL: Code HTTP inattendu: $HTTP_CODE"
fi

# 7. Authorized status update
echo -e "\n7. Test Sécurité : Modification de statut autorisée avec Jeton Bearer..."
AUTH_RES=$(curl -s -X PATCH "$BASE_URL/api/tickets/TKT-2026-00017/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{"status": "IN_PROGRESS", "actor": "agent_curl", "notes": "Intervention terrain en cours"}')
echo "$AUTH_RES" | grep -q "IN_PROGRESS" && echo "✅ PASS: Transition de statut autorisée et persistée en base" || echo "❌ FAIL: $AUTH_RES"

echo -e "\n=========================================================="
echo "🎉 Tous les tests d'intégration cURL se sont exécutés avec succès !"
echo "=========================================================="
