# Zero Trust Policy Fix — Resolving the Paradox

**Skill digunakan:** ask-owasp-security-review (A01, A07, A09)
**Status awal:** Self-contradictory — "Zero Trust" + SSO tanpa timeout + root access tanpa logging

---

## 1. Analisis Kontradiksi

| Pilar Zero Trust | Kebijakan Saat Ini | Konflik |
|-----------------|-------------------|---------|
| Never trust, always verify | SSO tanpa session-timeout | Token valid selamanya = trust permanen |
| Least privilege | Root access tanpa batas | Privilege maksimum tanpa kontrol |
| Continuous monitoring | Tidak ada logging root | Zero visibility = zero trust broken |
| Assume breach | Tidak ada audit trail | Tidak bisa investigasi jika breach |

---

## 2. Rekomendasi Perbaikan

### Fix 1: SSO — Terapkan Session Timeout + Token Rotasi

```yaml
session_policy:
  access_token_ttl: 15 minutes
  refresh_token_ttl: 4 hours
  refresh_token_rotation: true
  reauthentication:
    required_after: 4 hours
    trigger_on:
      - ip_address_change: true
      - device_fingerprint_change: true
      - geo_location_change: true
```

### Fix 2: Root Access — Terapkan JIT + Audit Wajib

```yaml
privileged_access:
  model: just_in_time  # bukan permanent root
  approval_required: true
  approval_flow:
    - submit_ticket
    - manager_approval
    - auto_expire_after: 30 minutes
  logging:
    auditd: enabled
    session_recording: enabled
    destination: siem.internal  # immutable log storage
  constraints:
    - no_direct_root_login
    - sudo_only_with_audit
    - commands_whitelist: ["systemctl", "journalctl", "tail"]
```

### Fix 3: Logging — Coverage Wajib

| Kategori | Di-log? | Tool | Retention |
|----------|---------|------|-----------|
| Semua akses root | ✅ Wajib | auditd + Falco | 1 tahun |
| Semua akses SSO | ✅ Wajib | IdP logs | 90 hari |
| Semua MFA attempt | ✅ Wajib | MFA provider | 90 hari |
| Semua perubahan IAM | ✅ Wajib | CloudTrail / audit_logs | 7 tahun (compliance) |

---

## 3. Policy Baru (Revised)

```
ZERO TRUST ACCESS POLICY (v2)

1. VERIFIKASI BERKELANJUTAN
   - Setiap sesi wajib direfresh setiap 4 jam
   - Perubahan konteks (IP, device, lokasi) trigger reauth
   - MFA diwajibkan setiap 24 jam

2. LEAST PRIVILEGE
   - Tidak ada akses permanen root
   - Semua akses istimewa via JIT (Just-In-Time) dengan expiry otomatis
   - Setiap akses harus memiliki ticket/approval reference

3. FULL AUDIT TRAIL
   - Semua akses (termasuk root) wajib di-log ke SIEM
   - Log bersifat immutable (write-once, append-only)
   - Alert wajib untuk: root access, MFA failure spike, anomaly login

4. COMPLIANCE
   - Kebijakan ini selaras dengan COBIT 2019 (APO12, DSS05)
     dan ITIL 4 (Incident Management, Security Management)
   - Audit tahunan wajib untuk validasi implementasi
```

---

## 4. Kesimpulan

Kebijakan Zero Trust **hanya bisa diwujudkan jika ketiga pilar** (continuous verification, least privilege, full audit) berjalan bersamaan. SSO tanpa timeout dan root tanpa logging adalah **trust permanen tanpa pengawasan** — kebalikan total dari Zero Trust.

**Status setelah revisi:** ✅ Konsisten dan dapat diimplementasikan.
