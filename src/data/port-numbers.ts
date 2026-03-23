export interface PortEntry {
  port: number;
  protocol: "TCP" | "UDP" | "TCP/UDP";
  service: string;
  description: string;
}

export interface PortGroup {
  id: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  ports: PortEntry[];
}

export const PORT_GROUPS: PortGroup[] = [
  {
    id: "web",
    label: "Web",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
    ports: [
      { port: 80, protocol: "TCP", service: "HTTP", description: "Hypertext Transfer Protocol — unencrypted web traffic." },
      { port: 443, protocol: "TCP", service: "HTTPS", description: "HTTP Secure — TLS-encrypted web traffic." },
      { port: 8080, protocol: "TCP", service: "HTTP (alt)", description: "Common alternate port for HTTP, often used by development servers and proxies." },
      { port: 8443, protocol: "TCP", service: "HTTPS (alt)", description: "Alternate HTTPS port, used when 443 is unavailable or for non-root services." },
      { port: 3000, protocol: "TCP", service: "Dev server", description: "Conventional port for local development servers (Node.js, React, Rails, etc.)." },
      { port: 5173, protocol: "TCP", service: "Vite dev", description: "Default port for the Vite frontend build tool dev server." },
      { port: 4200, protocol: "TCP", service: "Angular dev", description: "Default port for the Angular CLI development server." },
    ],
  },
  {
    id: "remote",
    label: "Remote Access",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    ports: [
      { port: 22, protocol: "TCP", service: "SSH / SFTP", description: "Secure Shell — encrypted remote login, command execution, and file transfer (SFTP)." },
      { port: 23, protocol: "TCP", service: "Telnet", description: "Unencrypted remote login protocol. Deprecated in favor of SSH." },
      { port: 3389, protocol: "TCP", service: "RDP", description: "Remote Desktop Protocol — Windows remote desktop sessions." },
      { port: 5900, protocol: "TCP", service: "VNC", description: "Virtual Network Computing — cross-platform remote desktop access." },
    ],
  },
  {
    id: "database",
    label: "Database",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    ports: [
      { port: 3306, protocol: "TCP", service: "MySQL / MariaDB", description: "MySQL and MariaDB relational database server." },
      { port: 5432, protocol: "TCP", service: "PostgreSQL", description: "PostgreSQL relational database server." },
      { port: 1433, protocol: "TCP", service: "Microsoft SQL Server", description: "Microsoft SQL Server database engine." },
      { port: 1521, protocol: "TCP", service: "Oracle DB", description: "Oracle Database listener default port." },
      { port: 27017, protocol: "TCP", service: "MongoDB", description: "MongoDB document database default port." },
      { port: 6379, protocol: "TCP", service: "Redis", description: "Redis in-memory data structure store." },
      { port: 5984, protocol: "TCP", service: "CouchDB", description: "Apache CouchDB document-oriented database HTTP API." },
      { port: 9200, protocol: "TCP", service: "Elasticsearch", description: "Elasticsearch REST API for full-text search and analytics." },
      { port: 9042, protocol: "TCP", service: "Cassandra", description: "Apache Cassandra native transport port." },
    ],
  },
  {
    id: "mail",
    label: "Mail",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
    ports: [
      { port: 25, protocol: "TCP", service: "SMTP", description: "Simple Mail Transfer Protocol — server-to-server email relay. Often blocked by ISPs." },
      { port: 587, protocol: "TCP", service: "SMTP Submission", description: "Mail submission port for authenticated clients sending mail. Preferred over port 25." },
      { port: 465, protocol: "TCP", service: "SMTPS", description: "SMTP over implicit TLS. Deprecated in favor of 587 with STARTTLS, but still widely used." },
      { port: 110, protocol: "TCP", service: "POP3", description: "Post Office Protocol v3 — download email from server (unencrypted)." },
      { port: 995, protocol: "TCP", service: "POP3S", description: "POP3 over TLS." },
      { port: 143, protocol: "TCP", service: "IMAP", description: "Internet Message Access Protocol — access mail on server without full download (unencrypted)." },
      { port: 993, protocol: "TCP", service: "IMAPS", description: "IMAP over TLS." },
    ],
  },
  {
    id: "filetransfer",
    label: "File Transfer",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    ports: [
      { port: 20, protocol: "TCP", service: "FTP data", description: "FTP active mode data transfer channel." },
      { port: 21, protocol: "TCP", service: "FTP control", description: "FTP command/control channel for authentication and commands." },
      { port: 69, protocol: "UDP", service: "TFTP", description: "Trivial File Transfer Protocol — simple, no-auth transfers used for PXE boot and firmware." },
      { port: 445, protocol: "TCP", service: "SMB / CIFS", description: "Server Message Block — Windows file sharing, network drives, and Active Directory." },
      { port: 2049, protocol: "TCP/UDP", service: "NFS", description: "Network File System — Unix/Linux network file sharing." },
      { port: 548, protocol: "TCP", service: "AFP", description: "Apple Filing Protocol — macOS network file sharing (largely superseded by SMB)." },
    ],
  },
  {
    id: "network",
    label: "Network",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    ports: [
      { port: 53, protocol: "TCP/UDP", service: "DNS", description: "Domain Name System — resolves hostnames to IP addresses. UDP for queries, TCP for zone transfers." },
      { port: 67, protocol: "UDP", service: "DHCP server", description: "Dynamic Host Configuration Protocol server — assigns IP addresses to clients." },
      { port: 68, protocol: "UDP", service: "DHCP client", description: "DHCP client — receives IP configuration from a DHCP server." },
      { port: 123, protocol: "UDP", service: "NTP", description: "Network Time Protocol — clock synchronization across network devices." },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring & Messaging",
    color: "#a78bfa",
    subtle: "#a78bfa18",
    border: "#a78bfa33",
    ports: [
      { port: 161, protocol: "UDP", service: "SNMP", description: "Simple Network Management Protocol — read device metrics and configuration." },
      { port: 162, protocol: "UDP", service: "SNMP Trap", description: "SNMP trap receiver — devices push alerts here rather than being polled." },
      { port: 514, protocol: "UDP", service: "Syslog", description: "System logging protocol — used to forward log messages to a central syslog server." },
      { port: 9090, protocol: "TCP", service: "Prometheus", description: "Prometheus metrics server and query interface." },
      { port: 9100, protocol: "TCP", service: "Node Exporter", description: "Prometheus Node Exporter — exposes host-level metrics (CPU, memory, disk)." },
      { port: 5672, protocol: "TCP", service: "AMQP (RabbitMQ)", description: "Advanced Message Queuing Protocol — RabbitMQ message broker." },
      { port: 15672, protocol: "TCP", service: "RabbitMQ Management", description: "RabbitMQ web management console and HTTP API." },
      { port: 1883, protocol: "TCP", service: "MQTT", description: "Message Queuing Telemetry Transport — lightweight pub/sub protocol for IoT." },
      { port: 9092, protocol: "TCP", service: "Kafka", description: "Apache Kafka distributed event streaming broker." },
      { port: 2375, protocol: "TCP", service: "Docker daemon", description: "Docker Engine API over unencrypted TCP. Never expose to untrusted networks." },
      { port: 2376, protocol: "TCP", service: "Docker daemon (TLS)", description: "Docker Engine API over TLS." },
    ],
  },
];
