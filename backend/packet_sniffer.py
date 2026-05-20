from scapy.all import sniff, IP
import time
import csv
import os

CSV_FILE = r"C:\VENOM\Coding\NOP\network-observability\backend\live_flows.csv"
HEADER = ["timestamp", "src_ip", "dst_ip", "bytes"]

def process_packet(packet):
    if IP in packet:
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        size = len(packet)
        ts = int(time.time())

        file_exists = os.path.exists(CSV_FILE)

        with open(CSV_FILE, "a", newline="") as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(HEADER)
            writer.writerow([ts, src_ip, dst_ip, size])

        print(f"{src_ip} → {dst_ip} | bytes={size}")

def start_sniffing():
    print("Starting live packet capture...")
    sniff(prn=process_packet, store=False)

if __name__ == "__main__":
    start_sniffing()
