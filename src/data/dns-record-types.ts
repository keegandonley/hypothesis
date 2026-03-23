export interface DnsRecord {
  type: string;
  fullName: string;
  description: string;
  example: string;
  notes?: string;
}

export interface DnsGroup {
  id: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  records: DnsRecord[];
}

export const DNS_GROUPS: DnsGroup[] = [
  {
    id: "address",
    label: "Address",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
    records: [
      {
        type: "A",
        fullName: "Address",
        description: "Maps a hostname to an IPv4 address.",
        example: "example.com. 300 IN A 93.184.216.34",
      },
      {
        type: "AAAA",
        fullName: "IPv6 Address",
        description: "Maps a hostname to an IPv6 address.",
        example: "example.com. 300 IN AAAA 2606:2800:220:1:248:1893:25c8:1946",
      },
    ],
  },
  {
    id: "naming",
    label: "Naming",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    records: [
      {
        type: "CNAME",
        fullName: "Canonical Name",
        description: "Alias that points one hostname to another. The target must ultimately resolve to an A or AAAA record. Cannot coexist with other record types at the same name.",
        example: "www.example.com. 300 IN CNAME example.com.",
      },
      {
        type: "NS",
        fullName: "Name Server",
        description: "Delegates a DNS zone to an authoritative name server. Every zone must have at least two NS records.",
        example: "example.com. 86400 IN NS ns1.example.com.",
      },
      {
        type: "SOA",
        fullName: "Start of Authority",
        description: "Contains administrative information about the zone: primary name server, admin email, serial number, and refresh/retry/expire intervals.",
        example: "example.com. 3600 IN SOA ns1.example.com. admin.example.com. 2024010101 3600 900 604800 300",
      },
      {
        type: "PTR",
        fullName: "Pointer",
        description: "Reverse DNS lookup — maps an IP address back to a hostname. PTR records live in the arpa. zone.",
        example: "34.216.184.93.in-addr.arpa. 3600 IN PTR example.com.",
      },
    ],
  },
  {
    id: "mail",
    label: "Mail",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
    records: [
      {
        type: "MX",
        fullName: "Mail Exchange",
        description: "Specifies the mail server responsible for accepting email for a domain. Lower preference values have higher priority.",
        example: "example.com. 300 IN MX 10 mail.example.com.",
      },
      {
        type: "TXT (SPF)",
        fullName: "Sender Policy Framework",
        description: "Specifies which mail servers are authorized to send email for the domain. Used by receiving servers to reject spoofed mail.",
        example: 'example.com. 300 IN TXT "v=spf1 include:_spf.google.com ~all"',
        notes: "Stored as a TXT record.",
      },
      {
        type: "TXT (DKIM)",
        fullName: "DomainKeys Identified Mail",
        description: "Publishes a public key used to verify cryptographic signatures on outgoing email, proving the message wasn't altered in transit.",
        example: 'selector._domainkey.example.com. 300 IN TXT "v=DKIM1; k=rsa; p=MIGfMA0..."',
        notes: "Stored as a TXT record under a selector subdomain.",
      },
      {
        type: "TXT (DMARC)",
        fullName: "Domain-based Message Authentication",
        description: "Policy record that tells receiving servers what to do with mail that fails SPF or DKIM checks: none, quarantine, or reject.",
        example: '_dmarc.example.com. 300 IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc@example.com"',
        notes: "Stored as a TXT record at _dmarc.",
      },
    ],
  },
  {
    id: "text",
    label: "Text & Service",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    records: [
      {
        type: "TXT",
        fullName: "Text",
        description: "Stores arbitrary text data associated with a domain. Used for domain verification, SPF, DKIM, DMARC, and other purposes.",
        example: 'example.com. 300 IN TXT "google-site-verification=abc123"',
      },
      {
        type: "SRV",
        fullName: "Service Locator",
        description: "Specifies the hostname and port for a specific service (e.g., SIP, XMPP, Minecraft). Format: priority weight port target.",
        example: "_xmpp-client._tcp.example.com. 300 IN SRV 10 5 5222 xmpp.example.com.",
      },
      {
        type: "CAA",
        fullName: "Certification Authority Authorization",
        description: "Restricts which certificate authorities may issue TLS certificates for the domain, reducing the risk of misissued certificates.",
        example: 'example.com. 300 IN CAA 0 issue "letsencrypt.org"',
      },
    ],
  },
  {
    id: "dnssec",
    label: "DNSSEC",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    records: [
      {
        type: "DS",
        fullName: "Delegation Signer",
        description: "Contains a hash of a DNSKEY record in a child zone, establishing a chain of trust from parent to child zone for DNSSEC validation.",
        example: "example.com. 3600 IN DS 12345 8 2 49FD...",
      },
      {
        type: "DNSKEY",
        fullName: "DNS Public Key",
        description: "Holds a public key used to verify DNSSEC signatures (RRSIG records) in the same zone.",
        example: "example.com. 3600 IN DNSKEY 257 3 8 AwEAAb...",
      },
      {
        type: "RRSIG",
        fullName: "Resource Record Signature",
        description: "DNSSEC cryptographic signature over a set of DNS records, allowing resolvers to verify authenticity.",
        example: "example.com. 3600 IN RRSIG A 8 2 300 20241231...",
      },
      {
        type: "NSEC",
        fullName: "Next Secure",
        description: "Used to prove the non-existence of a DNS name — lists the next existing name in the zone alphabetically.",
        example: "example.com. 3600 IN NSEC www.example.com. A MX RRSIG NSEC",
      },
    ],
  },
];
