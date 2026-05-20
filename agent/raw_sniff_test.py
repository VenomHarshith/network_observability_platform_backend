from scapy.all import sniff, IP

def show(pkt):
    if IP in pkt:
        print("RAW PKT", pkt[IP].src, "->", pkt[IP].dst, "proto", pkt[IP].proto)

print("Starting raw sniff...")
sniff(prn=show, store=False)
