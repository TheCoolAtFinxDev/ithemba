-- Prevents double-booking the same provider slot under concurrent requests.
-- Partial index (not representable in schema.prisma directly) — excludes the
-- same statuses the app's own conflict check already treats as non-occupying.
CREATE UNIQUE INDEX "appointments_provider_slot_unique"
ON "appointments" ("providerId", "startUtc")
WHERE "status" NOT IN ('CancelledByPatient', 'CancelledByProvider', 'NoShow');
