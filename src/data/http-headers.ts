export type HeaderDirection = "request" | "response" | "both";

export interface HttpHeader {
  name: string;
  description: string;
  direction: HeaderDirection;
  deprecated?: boolean;
  experimental?: boolean;
}

export interface HeaderCategory {
  id: string;
  label: string;
  badge: string;
  color: string;
  subtle: string;
  border: string;
  headers: HttpHeader[];
}

export const HEADER_CATEGORIES: HeaderCategory[] = [
  {
    id: "caching",
    label: "Caching",
    badge: "Cache",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    headers: [
      {
        name: "Cache-Control",
        description:
          "Directives for caching mechanisms in both requests and responses, such as max-age, no-cache, no-store, and must-revalidate.",
        direction: "both",
      },
      {
        name: "ETag",
        description:
          "An opaque identifier for a specific version of a resource, used for cache validation and conditional requests.",
        direction: "response",
      },
      {
        name: "If-Match",
        description:
          "Makes a request conditional: the server only processes the request if the resource's ETag matches one of the listed ETags.",
        direction: "request",
      },
      {
        name: "If-None-Match",
        description:
          "Makes a request conditional: the server returns 304 Not Modified if the resource's ETag matches one of the listed ETags.",
        direction: "request",
      },
      {
        name: "If-Modified-Since",
        description:
          "Makes a request conditional: the server returns the resource only if it has been modified after the given date.",
        direction: "request",
      },
      {
        name: "If-Unmodified-Since",
        description:
          "Makes a request conditional: the server processes it only if the resource has not been modified since the given date.",
        direction: "request",
      },
      {
        name: "Last-Modified",
        description:
          "The date and time at which the server believes the resource was last modified.",
        direction: "response",
      },
      {
        name: "Expires",
        description:
          "The date/time after which the response is considered stale. Superseded by Cache-Control max-age when both are present.",
        direction: "response",
      },
      {
        name: "Age",
        description:
          "The number of seconds the object has been in a proxy cache.",
        direction: "response",
      },
      {
        name: "Vary",
        description:
          "Indicates which request headers a cache should use to determine whether a cached response can be used.",
        direction: "response",
      },
      {
        name: "Pragma",
        description:
          "Implementation-specific directives; no-cache is the only standard directive. Superseded by Cache-Control.",
        direction: "both",
        deprecated: true,
      },
      {
        name: "Clear-Site-Data",
        description:
          "Clears browsing data (cookies, storage, cache) associated with the requesting website.",
        direction: "response",
      },
    ],
  },
  {
    id: "auth",
    label: "Authentication",
    badge: "Auth",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
    headers: [
      {
        name: "Authorization",
        description:
          "Credentials to authenticate a user agent with a server, typically a Bearer token or Basic base64-encoded credentials.",
        direction: "request",
      },
      {
        name: "WWW-Authenticate",
        description:
          "Defines the authentication method that should be used to access a resource, sent with a 401 Unauthorized response.",
        direction: "response",
      },
      {
        name: "Proxy-Authorization",
        description:
          "Credentials to authenticate a user agent with a proxy server.",
        direction: "request",
      },
      {
        name: "Proxy-Authenticate",
        description:
          "Defines the authentication method required to access a resource behind a proxy, sent with a 407 response.",
        direction: "response",
      },
    ],
  },
  {
    id: "cors",
    label: "CORS",
    badge: "CORS",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
    headers: [
      {
        name: "Origin",
        description:
          "The origin of the cross-site access request or preflight request: scheme, hostname, and optionally port.",
        direction: "request",
      },
      {
        name: "Access-Control-Allow-Origin",
        description:
          "Indicates which origins are permitted to read the response. Either a specific origin or * for any origin.",
        direction: "response",
      },
      {
        name: "Access-Control-Allow-Methods",
        description:
          "Specifies the HTTP methods allowed in a cross-origin request, used in preflight responses.",
        direction: "response",
      },
      {
        name: "Access-Control-Allow-Headers",
        description:
          "Indicates which HTTP headers can be used during an actual cross-origin request.",
        direction: "response",
      },
      {
        name: "Access-Control-Allow-Credentials",
        description:
          "Whether the response to the request can be exposed when credentials (cookies, auth headers) are included.",
        direction: "response",
      },
      {
        name: "Access-Control-Expose-Headers",
        description:
          "Lists which headers can be exposed as part of the response by listing their names.",
        direction: "response",
      },
      {
        name: "Access-Control-Max-Age",
        description:
          "How long (in seconds) the results of a preflight request can be cached.",
        direction: "response",
      },
      {
        name: "Access-Control-Request-Headers",
        description:
          "Used in preflight requests to tell the server which HTTP headers will be used in the actual request.",
        direction: "request",
      },
      {
        name: "Access-Control-Request-Method",
        description:
          "Used in preflight requests to tell the server which HTTP method will be used in the actual request.",
        direction: "request",
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    badge: "Sec",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    headers: [
      {
        name: "Content-Security-Policy",
        description:
          "Controls resources the user agent can load, helping prevent XSS attacks by declaring approved content sources.",
        direction: "response",
      },
      {
        name: "Content-Security-Policy-Report-Only",
        description:
          "Monitors (but does not enforce) a CSP policy and reports violations to a specified URI.",
        direction: "response",
      },
      {
        name: "Strict-Transport-Security",
        description:
          "Tells browsers to only access the site using HTTPS for a specified duration (HSTS).",
        direction: "response",
      },
      {
        name: "X-Frame-Options",
        description:
          "Indicates whether a browser should render the page in a frame, iframe, embed, or object. Superseded by CSP frame-ancestors.",
        direction: "response",
      },
      {
        name: "X-Content-Type-Options",
        description:
          "Prevents browsers from MIME-sniffing a response away from the declared Content-Type. Value is always nosniff.",
        direction: "response",
      },
      {
        name: "Referrer-Policy",
        description:
          "Controls how much referrer information is included with requests: no-referrer, same-origin, strict-origin, etc.",
        direction: "both",
      },
      {
        name: "Permissions-Policy",
        description:
          "Allows a site to control which browser features and APIs can be used in the browser (formerly Feature-Policy).",
        direction: "response",
      },
      {
        name: "Cross-Origin-Embedder-Policy",
        description:
          "Prevents documents from loading cross-origin resources that don't grant explicit permission (require-corp, unsafe-none).",
        direction: "response",
      },
      {
        name: "Cross-Origin-Opener-Policy",
        description:
          "Allows a document to isolate itself from cross-origin window references, enabling use of SharedArrayBuffer.",
        direction: "response",
      },
      {
        name: "Cross-Origin-Resource-Policy",
        description:
          "Prevents other domains from reading the response by restricting which origins can load the resource.",
        direction: "response",
      },
      {
        name: "X-XSS-Protection",
        description:
          "Enables the cross-site scripting filter built into older browsers. Non-standard and largely superseded by CSP.",
        direction: "response",
        deprecated: true,
      },
    ],
  },
  {
    id: "content",
    label: "Content Negotiation",
    badge: "Content",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    headers: [
      {
        name: "Accept",
        description:
          "Informs the server about the types of data the client can process, expressed as MIME types with optional quality factors.",
        direction: "request",
      },
      {
        name: "Accept-Encoding",
        description:
          "Indicates the content-coding the client understands: gzip, deflate, br (Brotli), zstd, identity.",
        direction: "request",
      },
      {
        name: "Accept-Language",
        description:
          "Advertises which natural languages the client prefers, with optional quality factors (e.g., en-US,en;q=0.9).",
        direction: "request",
      },
      {
        name: "Content-Type",
        description:
          "Indicates the media type of the request or response body, e.g., application/json or text/html; charset=utf-8.",
        direction: "both",
      },
      {
        name: "Content-Encoding",
        description:
          "Lists the encodings applied to the body: gzip, deflate, br. The receiver must decode in reverse order.",
        direction: "both",
      },
      {
        name: "Content-Language",
        description:
          "Describes the natural language(s) intended for the audience of the response body.",
        direction: "both",
      },
      {
        name: "Content-Length",
        description:
          "The size of the message body in bytes, used to delimit the end of the body in HTTP/1.1.",
        direction: "both",
      },
      {
        name: "Content-Location",
        description:
          "An alternate location for the returned data, used to indicate the URL of the resource in the body.",
        direction: "both",
      },
      {
        name: "Content-Range",
        description:
          "Indicates where in a full body message a partial message belongs, used with 206 Partial Content.",
        direction: "response",
      },
    ],
  },
  {
    id: "request",
    label: "Request",
    badge: "Req",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    headers: [
      {
        name: "Host",
        description:
          "Specifies the host and port number of the server to which the request is sent. Required in HTTP/1.1.",
        direction: "request",
      },
      {
        name: "User-Agent",
        description:
          "A characteristic string identifying the application, OS, vendor, and version of the requesting client.",
        direction: "request",
      },
      {
        name: "Referer",
        description:
          "The URL of the previous web page from which the request was initiated. Note: intentionally misspelled in the spec.",
        direction: "request",
      },
      {
        name: "Cookie",
        description:
          "Contains stored HTTP cookies previously sent by the server with Set-Cookie headers.",
        direction: "request",
      },
      {
        name: "Range",
        description:
          "Indicates the part of a document the server should return, used for resumable downloads (e.g., bytes=0-1023).",
        direction: "request",
      },
      {
        name: "If-Range",
        description:
          "Makes a Range request conditional: if the entity tag or date matches, the partial content is returned; otherwise the full resource.",
        direction: "request",
      },
      {
        name: "Expect",
        description:
          "Indicates expectations the server needs to fulfill before processing the request body (e.g., 100-continue).",
        direction: "request",
      },
      {
        name: "Forwarded",
        description:
          "Contains information from the client-facing side of proxy servers, standardizing X-Forwarded-For.",
        direction: "request",
      },
      {
        name: "X-Forwarded-For",
        description:
          "De-facto standard for identifying the originating IP address of a client connecting through a proxy or load balancer.",
        direction: "request",
      },
      {
        name: "X-Forwarded-Host",
        description:
          "Identifies the original Host header as received by the client before being modified by a proxy.",
        direction: "request",
      },
      {
        name: "X-Forwarded-Proto",
        description:
          "Identifies the protocol (HTTP or HTTPS) that a client used when connecting through a proxy.",
        direction: "request",
      },
      {
        name: "From",
        description:
          "An Internet email address for a human user who controls the requesting user agent. Primarily used by bots.",
        direction: "request",
      },
      {
        name: "TE",
        description:
          "Specifies the transfer encodings the client is willing to accept and whether chunked transfer is acceptable.",
        direction: "request",
      },
      {
        name: "Upgrade-Insecure-Requests",
        description:
          "Signals the client's preference for an encrypted and authenticated response, upgrading HTTP to HTTPS.",
        direction: "request",
      },
    ],
  },
  {
    id: "response",
    label: "Response",
    badge: "Res",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    headers: [
      {
        name: "Location",
        description:
          "Indicates the URL to redirect to in a 3xx redirect or the URL of the newly created resource in a 201 response.",
        direction: "response",
      },
      {
        name: "Server",
        description:
          "Contains information about the software used by the origin server to handle the request.",
        direction: "response",
      },
      {
        name: "Set-Cookie",
        description:
          "Sends a cookie from the server to the browser. Supports attributes like Expires, Path, Domain, Secure, HttpOnly, SameSite.",
        direction: "response",
      },
      {
        name: "Allow",
        description:
          "Lists the set of HTTP request methods supported by a resource, sent with a 405 Method Not Allowed response.",
        direction: "response",
      },
      {
        name: "Retry-After",
        description:
          "Indicates how long the client should wait before making a follow-up request, used with 429 and 503 responses.",
        direction: "response",
      },
      {
        name: "Link",
        description:
          "Provides a means for serialising relationships between resources in the header, similar to HTML <link> elements.",
        direction: "response",
      },
      {
        name: "Content-Disposition",
        description:
          "Indicates if the content should be displayed inline or downloaded as an attachment with an optional filename.",
        direction: "response",
      },
      {
        name: "Refresh",
        description:
          "Instructs the browser to refresh the page or redirect after a given number of seconds.",
        direction: "response",
      },
      {
        name: "X-Request-ID",
        description:
          "A unique identifier for the request, used for tracing and correlating requests across distributed systems.",
        direction: "both",
      },
    ],
  },
  {
    id: "connection",
    label: "Connection",
    badge: "Conn",
    color: "#a78bfa",
    subtle: "#a78bfa18",
    border: "#a78bfa33",
    headers: [
      {
        name: "Connection",
        description:
          "Controls whether the network connection stays open after the current transaction: keep-alive or close.",
        direction: "both",
      },
      {
        name: "Keep-Alive",
        description:
          "Controls how long a persistent connection should remain open (timeout and max parameters).",
        direction: "both",
      },
      {
        name: "Upgrade",
        description:
          "Allows the client to specify additional communication protocols it supports, used to upgrade to WebSocket.",
        direction: "both",
      },
      {
        name: "Transfer-Encoding",
        description:
          "Specifies the encoding applied to the body when transferring between nodes: chunked, compress, deflate, gzip.",
        direction: "both",
      },
      {
        name: "Trailer",
        description:
          "Allows the sender to include additional fields at the end of chunked transfer-encoded messages.",
        direction: "both",
      },
      {
        name: "Via",
        description:
          "Added by proxies to track message forwards and identify protocol capabilities.",
        direction: "both",
      },
    ],
  },
  {
    id: "transfer",
    label: "Transfer & Body",
    badge: "Body",
    color: "#f472b6",
    subtle: "#f472b618",
    border: "#f472b633",
    headers: [
      {
        name: "Accept-Ranges",
        description:
          "Indicates whether the server supports range requests for the resource: bytes or none.",
        direction: "response",
      },
      {
        name: "Content-MD5",
        description:
          "An MD5 digest of the entity body for end-to-end message integrity checking. Deprecated in favour of Digest.",
        direction: "both",
        deprecated: true,
      },
      {
        name: "Digest",
        description:
          "A digest of the representation, providing integrity verification for the message body (e.g., sha-256=…).",
        direction: "both",
      },
      {
        name: "Want-Digest",
        description:
          "Requests that the server include a Digest header in the response, specifying preferred algorithm.",
        direction: "request",
      },
      {
        name: "Max-Forwards",
        description:
          "Limits the number of times a request can be forwarded through proxies or gateways, used with TRACE and OPTIONS.",
        direction: "request",
      },
    ],
  },
];
