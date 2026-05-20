from scapy.all import sniff, IP
import time
import queue
from collections import defaultdict
import threading

packet_queue = queue.Queue()

def handle_packet(pkt):

    if IP not in pkt:
        return

    packet = {
        "ts": time.time(),
        "src": pkt[IP].src,
        "dst": pkt[IP].dst,
        "proto": pkt[IP].proto,
        "size": len(pkt)
    }

    packet_queue.put(packet)

flows = defaultdict(lambda: {
    "bytes": 0,
    "packets": 0
})
import csv
import os

CSV_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
    "flows.csv"
)

def flow_aggregator():
    last_flush = time.time()

    # Create CSV file + header once
    file_exists = os.path.isfile(CSV_PATH)
    with open(CSV_PATH, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow([
                "timestamp",
                "src_ip",
                "dst_ip",
                "protocol",
                "bytes",
                "packets"
            ])

    while True:
        try:
            while True:
                p = packet_queue.get_nowait()

                key = (p["src"], p["dst"], p["proto"])

                flows[key]["bytes"] += p["size"]
                flows[key]["packets"] += 1

        except queue.Empty:
            pass

        if time.time() - last_flush >= 5:
            ts = int(time.time())

            if flows:
                with open(CSV_PATH, "a", newline="") as f:
                    writer = csv.writer(f)
                    for (src, dst, proto), stats in flows.items():
                        writer.writerow([
                            ts,
                            src,
                            dst,
                            proto,
                            stats["bytes"],
                            stats["packets"]
                        ])

                print(f"\n--- SAVED {len(flows)} FLOWS TO CSV ---")
                flows.clear()

            last_flush = time.time()

        time.sleep(0.2)

from scapy.all import get_if_list

print(get_if_list())

def start_capture():
    sniff(
        iface="Wi-Fi",   # or Ethernet
        prn=handle_packet,
        store=False
    )
if __name__ == "__main__":
    print("Packet agent started...")
    threading.Thread(target=flow_aggregator, daemon=True).start()
    start_capture()
