"""
Skenario alternatif untuk perbandingan
"""
from simulasi_autoscaling import simulasi_scaling, cetak_hasil

print("=== SKENARIO DEFAULT (CPU 90% terus) ===")
h = simulasi_scaling(cpu=90, durasi_menit=15)
cetak_hasil(h)

print("\n=== SKENARIO CPU TURUN (90% -> 70% di menit 10) ===")
# Simulasi dengan CPU variable
pod = 8
cpu_values = [(5, 90), (10, 70), (15, 70)]
hard_limit = 15
history = [{"menit": 0, "pod": 8, "cpu": 90, "event": "initial"}]
for t, cpu in cpu_values:
    if cpu > 80:
        tambah = max(1, int(pod * 0.5))
        pod_baru = pod + tambah
        if pod_baru > hard_limit:
            pod_baru = hard_limit
            event = f"CPU {cpu}% >80% -> trigger +{tambah}, capped at {hard_limit}"
        else:
            event = f"CPU {cpu}% >80% -> trigger +{tambah} -> {pod_baru} pod"
        pod = pod_baru
    else:
        if pod > 4:
            scale_in = max(1, int(pod * 0.5))
            pod = max(4, pod - scale_in)
            event = f"CPU {cpu}% <=80% -> scale-in -{scale_in} -> {pod} pod"
        else:
            event = f"CPU {cpu}% <=80% -> stabil di {pod} pod"
    history.append({"menit": t, "pod": pod, "cpu": cpu, "event": event})

cetak_hasil(history, hard_limit)

print("\n=== SKENARIO HARD LIMIT DINAINKAN JADI 20 ===")
h = simulasi_scaling(hard_limit=20, durasi_menit=15)
cetak_hasil(h, hard_limit=20)
