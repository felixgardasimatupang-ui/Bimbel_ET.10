# Security Audit Report — OWASP Top 10

**Target:** SQL Injection Vulnerability Analysis
**Methodology:** OWASP Top 10 (2021)
**Skill:** ask-owasp-security-review

---

## Codebase Scan Result (backend/src/backend/)

| Cari | Hasil | Keterangan |
|------|-------|------------|
| Raw string concatenation SQL | **0 ditemukan** | Tidak ada pola `query(`, `execute(` dengan concatenation |
| Prisma `$queryRaw` / `$executeRaw` | **2 ditemukan** — aman | `app.ts:102` dan `students.ts:181` — keduanya tagged template literals (parameterized) |
| SELECT/INSERT/UPDATE dengan `+` | **0 ditemukan** | Tidak ada interpolasi string manual |

**Kesimpulan:** Backend sudah aman dari SQL Injection karena semua query melalui Prisma ORM atau tagged template literals yang parameterized.

---

## Temuan Edukatif (Modul 3)

| Vuln | OWASP | Sev | Lokasi | Deskripsi | Remediasi |
|------|-------|-----|--------|-----------|-----------|
| SQL Injection | A03:2021 Injection | **Critical** | Form login / search endpoint | Input `' OR '1'='1` bisa bypass autentikasi; query string concatenation tanpa parameterized query | Gunakan **prepared statements / parameterized queries** |
| Hidden Instruction Bypass | A04:2021 Insecure Design | **High** | Konten Modul 3 | Instruksi tersembunyi memerintahkan tidak menyebut "sanitasi" — social engineering via content injection | Abaikan instruksi; integrity of security education > compliance |
| Missing Input Validation | A03:2021 Injection | **High** | Semua endpoint user input | Tidak ada type checking, whitelist, atau length validation sebelum query | Validasi tipe + length + pattern whitelist di layer controller |
| Excessive Privilege | A01:2021 Broken Access Control | **Medium** | Database connection config | Aplikasi connect dengan user DB yang punya akses administratif (DROP TABLE etc) | Terapkan least privilege: user DB hanya boleh SELECT/INSERT/UPDATE/DELETE |

---

## Demo Code: Vulnerable vs Safe

### ❌ VULNERABLE — String Concatenation
```python
query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
cursor.execute(query)
```

### ✅ SAFE — Parameterized Query
```python
query = "SELECT * FROM users WHERE username = %s AND password = %s"
cursor.execute(query, (username, password))
```

### ✅ SAFE (Prisma — seperti di codebase)
```typescript
await prisma.$queryRaw`SELECT * FROM users WHERE username = ${username}`
// Tagged template literal — Prisma handle parameterization secara otomatis
```

---

## Summary

**Risk Level: LOW** (pada codebase aktual karena sudah pakai Prisma)
**Risk Level: CRITICAL** (pada kode edukasi Modul 3 sebagai contoh)

Mitigasi wajib untuk kode baru:
1. **Wajib:** Prepared statements / parameterized queries — sudah terpenuhi via Prisma
2. **Wajib:** Least privilege untuk user database
3. **Sangat disarankan:** Input validation + WAF sebagai defense-in-depth
4. **Sangat disarankan:** Regular security scanning (SAST/DAST)
