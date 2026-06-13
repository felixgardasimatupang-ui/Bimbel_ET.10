"""
Simulasi Auto-scaling — Modul 1
Kondisi: 8 pod aktif, hard limit 15, trigger CPU>80% 5 menit -> +50%
"""

def simulasi_scaling(pod_awal=8, hard_limit=15, durasi_menit=30, cpu=90, interval=5):
    pod = pod_awal
    history = [{"menit": 0, "pod": pod, "cpu": cpu, "event": "initial"}]

    for t in range(interval, durasi_menit + 1, interval):
        if cpu > 80:
            tambah = max(1, int(pod * 0.5))
            pod_baru = pod + tambah
            if pod_baru > hard_limit:
                pod_baru = hard_limit
                event = f"trigger +{tambah} -> capped at {hard_limit} (hard limit)"
            else:
                event = f"trigger +{tambah} -> {pod_baru} pod"
            pod = pod_baru
        else:
            event = f"CPU {cpu}% <= 80%, no scaling"

        history.append({"menit": t, "pod": pod, "cpu": cpu, "event": event})

    return history

def cetak_hasil(history, hard_limit=15):
    print(f"{'Menit':<8} {'Pod':<6} {'CPU':<6} {'Event':<50}")
    print("-" * 70)
    for h in history:
        print(f"{h['menit']:<8} {h['pod']:<6} {h['cpu']:<6} {h['event']:<50}")
    akhir = history[-1]
    tercapai = "tercapai" if akhir['pod'] == hard_limit else "belum"
    print(f"\nKesimpulan: Setelah {akhir['menit']} menit -> {akhir['pod']} pod (hard limit {tercapai})")

if __name__ == "__main__":
    history = simulasi_scaling()
    cetak_hasil(history)
