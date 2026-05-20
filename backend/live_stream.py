from scapy.all import sniff, IP, IPv6
import time
import pandas as pd
import numpy as np
from collections import deque
from threading import Thread, Lock

WINDOW_SIZE = 5
buffer = deque(maxlen=50000)
lock = Lock()

def entropy(series):
    probs = series.value_counts(normalize=True)
    return -np.sum(probs * np.log2(probs + 1e-9))

# ---------------- PACKET CAPTURE ----------------

def packet_sniffer():
    def process(packet):
        try:
            if IP in packet:
                src = packet[IP].src
                dst = packet[IP].dst
            elif IPv6 in packet:
                src = packet[IPv6].src
                dst = packet[IPv6].dst
            else:
                return

            with lock:
                buffer.append((time.time(), src, dst, len(packet)))

        except:
            pass

    print("Starting live packet capture...")
    sniff(prn=process, store=False)


# ---------------- STREAM PROCESSOR ----------------

def stream_processor():
    print("Starting real-time stream processor...")

    while True:
        time.sleep(1)

        with lock:
            if len(buffer) < 10:
                continue
            data = list(buffer)

        df = pd.DataFrame(data, columns=["timestamp", "src_ip", "dst_ip", "bytes"])

        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="s")
        now = pd.Timestamp.now()

        df = df[df["timestamp"] >= now - pd.Timedelta(seconds=WINDOW_SIZE)]

        if df.empty:
            continue

        traffic = int(df["bytes"].sum())
        conn_count = int(len(df))
        fan_out = round(df.groupby("src_ip")["dst_ip"].nunique().mean(), 2)
        dst_entropy = round(entropy(df["dst_ip"]), 3)

        print("\n[STREAM FEATURES]")
        print("timestamp:", now)
        print("total_bytes:", traffic)
        print("conn_count:", conn_count)
        print("avg_fan_out:", fan_out)
        print("dst_ip_entropy:", dst_entropy)


# ---------------- MAIN ----------------

if __name__ == "__main__":
    t1 = Thread(target=packet_sniffer, daemon=True)
    t2 = Thread(target=stream_processor, daemon=True)

    t1.start()
    t2.start()

    t1.join()
    t2.join()
