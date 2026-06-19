# Struktur Agent & Skill — Flow Diagram

## 1. Agent Flow

```mermaid
flowchart TD
    User["👤 User (Tugas)"] --> Manager["🧠 Manager Agent\nDeepSeek V4 Flash Free"]

    Manager --> Analyze{"Analisis Tugas"}

    Analyze -->|"System Design"| Architect["🏗 Architect\nDeepSeek V4 Flash"]
    Analyze -->|"Cari File / Search"| Explorer["🔍 Explorer\nMiMo V2.5 Free"]
    Analyze -->|"API / Prisma / DB"| Backend["⚙️ Backend\nDeepSeek V4 Flash"]
    Analyze -->|"React / UI / Tailwind"| Frontend["🎨 Frontend\nMiMo V2.5 Free"]
    Analyze -->|"Schema / Migrasi"| Database["🗄️ Database\nDeepSeek V4 Flash"]
    Analyze -->|"Unit / E2E Test"| Tester["🧪 Tester\nDeepSeek V4 Flash"]
    Analyze -->|"OWASP / Auth Audit"| Security["🔒 Security\nDeepSeek V4 Flash"]
    Analyze -->|"Docker / CI/CD"| DevOps["🚀 DevOps\nMiMo V2.5 Free"]
    Analyze -->|"Code Review"| Reviewer["📝 Reviewer\nMiMo V2.5 Free"]

    subgraph Fallback["4-Layer Fallback"]
        Kiro["Kiro AI"] --> Groq["Groq"] --> OpenRouter["OpenRouter"] --> Gemini["Gemini 2.5 Flash"]
    end

    Architect --> Fallback
    Explorer --> Fallback
    Backend --> Fallback
    Frontend --> Fallback
    Database --> Fallback
    Tester --> Fallback
    Security --> Fallback
    DevOps --> Fallback
    Reviewer --> Fallback

    subgraph Agents["9 Sub-Agent — 2 Model Final"]
        Architect
        Explorer
        Backend
        Frontend
        Database
        Tester
        Security
        DevOps
        Reviewer
    end

    Agents -->|"Hasil"| Manager
    Manager -->|"Respon"| User
```

---

## 2. Skill Discovery Flow

```mermaid
flowchart LR
    Task["📋 User Task"] --> Check{"Cek skills/\nSKILL.md?"}
    Check -->|"Cocok"| Invoke["🔧 Invoke skill tool\n& ikuti instruksi"]
    Check -->|"Tidak cocok"| Direct["✅ Kerjakan langsung"]
    Invoke --> Done["Selesai"]
    Direct --> Done
```

---

## 3. Struktur Folder Skill

```mermaid
flowchart LR
    Skill["📁 skill-name/"] --> SKILL["📄 SKILL.md\n(Instruksi wajib)"]
    Skill --> Ref["📁 references/\n(Dokumen pendukung)"]
    Skill --> Assets["📁 assets/\n(Template, contoh)"]
    Skill --> Scripts["📁 scripts/\n(Automation)"]
    Skill --> Templates["📁 templates/\n(Template kode)"]
```

---

## 4. Agent & Model Assignment

| Agent | Model | Alasan |
|-------|-------|--------|
| **Manager** | DeepSeek V4 Flash Free | Orkestrasi & delegasi |
| **Architect** | DeepSeek V4 Flash Free | Logika arsitektur & skema |
| **Backend** | DeepSeek V4 Flash Free | Presisi sintaks, Prisma, RBAC |
| **Database** | DeepSeek V4 Flash Free | Ketepatan query & migrasi |
| **Tester** | DeepSeek V4 Flash Free | Akurasi assertion & coverage |
| **Security** | DeepSeek V4 Flash Free | Rule-based analysis |
| **Explorer** | MiMo V2.5 Free | 1M context — jelajah file |
| **Frontend** | MiMo V2.5 Free | 1M context — lihat component tree |
| **Reviewer** | MiMo V2.5 Free | 1M context — review seluruh codebase |
| **DevOps** | MiMo V2.5 Free | Banyak baca config, sedikit generate |

---

## 5. Change Log

| Tanggal | Perubahan |
|---------|-----------|
| 19 Jun 2026 | Final: 2 model (DeepSeek V4 Flash + MiMo V2.5). Logic → DeepSeek, Context → MiMo. |
