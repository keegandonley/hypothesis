# CIDR

Calculate subnet details from CIDR (Classless Inter-Domain Routing) notation using bitwise arithmetic.

## Input

Enter an IPv4 address in CIDR notation:

```
192.168.1.0/24
10.0.0.0/8
172.16.0.0/12
```

You can also enter a bare IP address without a prefix (defaults to `/32`).

## Output Fields

| Field | Description |
|-------|-------------|
| Network Address | First address of the subnet (host bits all zero) |
| Broadcast Address | Last address of the subnet (host bits all one) |
| Subnet Mask | Dotted-decimal representation of the prefix mask |
| Wildcard Mask | Inverse of the subnet mask (used in ACLs) |
| First Host | First usable host address (network + 1) |
| Last Host | Last usable host address (broadcast − 1) |
| Total Hosts | 2^(32 − prefix) |
| Usable Hosts | Total hosts − 2 (excludes network and broadcast) |
| CIDR Notation | Canonical CIDR of the network |
| IPv4 Class | Classful classification and private range info |

For `/31` and `/32` subnets, all addresses are considered usable (point-to-point links).

## IPv4 Classes

| Class | Range | Default Use |
|-------|-------|-------------|
| A | 0.0.0.0 – 127.255.255.255 | Large networks |
| B | 128.0.0.0 – 191.255.255.255 | Medium networks |
| C | 192.0.0.0 – 223.255.255.255 | Small networks |
| D | 224.0.0.0 – 239.255.255.255 | Multicast |
| E | 240.0.0.0 – 255.255.255.255 | Reserved |

## Private Ranges (RFC 1918)

| Range | CIDR |
|-------|------|
| 10.0.0.0 – 10.255.255.255 | 10.0.0.0/8 |
| 172.16.0.0 – 172.31.255.255 | 172.16.0.0/12 |
| 192.168.0.0 – 192.168.255.255 | 192.168.0.0/16 |

## Permalink

The current CIDR expression is encoded in the URL as `?cidr=<value>`. Copy the URL to share or bookmark a specific subnet calculation.

## Reset

Clears the input and removes the URL parameter.
