from scapy.all import sniff, IP, get_if_list
import time
import queue
from collections import defaultdict
import threading
import csv
import os
import requests

# ==============================
# CONFIG
# ==============================

BACKEND_URL = "https://network-observability-api.onrender.com/flows"

CSV_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
    "flows.csv"
)

packet_queue = queue.Queue()

flows = defaultdict(lambda: {
    "bytes": 0,
    "packets": 0
})

# ==============================
# PACKET HANDLER
# ==============================

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

# ==============================
# FLOW AGGREGATOR
# ==============================

def flow_aggregator():

    last_flush = time.time()

    # Create CSV file with header
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

        # Collect packets from queue
        try:

            while True:

                p = packet_queue.get_nowait()

                key = (p["src"], p["dst"], p["proto"])

                flows[key]["bytes"] += p["size"]
                flows[key]["packets"] += 1

        except queue.Empty:
            pass

        # Flush every 5 seconds
        if time.time() - last_flush >= 5:

            ts = int(time.time())

            if flows:

                batch = []

                with open(CSV_PATH, "a", newline="") as f:

                    writer = csv.writer(f)

                    for (src, dst, proto), stats in flows.items():

                        flow_data = {
                            "timestamp": ts,
                            "src_ip": src,
                            "dst_ip": dst,
                            "protocol": proto,
                            "bytes": stats["bytes"],
                            "packets": stats["packets"]
                        }

                        batch.append(flow_data)

                        # Save locally to CSV
                        writer.writerow([
                            ts,
                            src,
                            dst,
                            proto,
                            stats["bytes"],
                            stats["packets"]
                        ])

                # Send to backend
                try:

                    response = requests.post(
                        BACKEND_URL,
                        json=batch,
                        timeout=5
                    )

                    print(f"\nSENT {len(batch)} FLOWS → HTTP {response.status_code}")

                except Exception as e:

                    print(f"\nFAILED TO SEND FLOWS: {e}")

                flows.clear()

            last_flush = time.time()

        time.sleep(0.2)

# ==============================
# START CAPTURE
# ==============================

print(get_if_list())

def start_capture():

    sniff(
        iface="Wi-Fi",      # change if needed
        prn=handle_packet,
        store=False
    )

# ==============================
# MAIN
# ==============================

if __name__ == "__main__":

    print("Packet agent started...")

    threading.Thread(
        target=flow_aggregator,
        daemon=True
    ).start()

    start_capture()