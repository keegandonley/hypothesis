export type StatusClass = "1xx" | "2xx" | "3xx" | "4xx" | "5xx";

export interface StatusCode {
  code: number;
  name: string;
  description: string;
}

export interface StatusClassConfig {
  class: StatusClass;
  label: string;
  color: string;
  subtle: string;
  border: string;
}

export const STATUS_CLASSES: StatusClassConfig[] = [
  {
    class: "1xx",
    label: "Informational",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
  },
  {
    class: "2xx",
    label: "Success",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
  },
  {
    class: "3xx",
    label: "Redirection",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
  },
  {
    class: "4xx",
    label: "Client Error",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
  },
  {
    class: "5xx",
    label: "Server Error",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
  },
];

export const STATUS_CODES: Record<StatusClass, StatusCode[]> = {
  "1xx": [
    {
      code: 100,
      name: "Continue",
      description:
        "Server has received the request headers; client should proceed to send the body.",
    },
    {
      code: 101,
      name: "Switching Protocols",
      description:
        "Server is switching protocols as requested — e.g., upgrading to WebSocket.",
    },
    {
      code: 102,
      name: "Processing",
      description:
        "Request received and is being processed, but no response is available yet. (WebDAV)",
    },
    {
      code: 103,
      name: "Early Hints",
      description:
        "Preliminary response with Link headers so the client can begin preloading resources.",
    },
  ],

  "2xx": [
    {
      code: 200,
      name: "OK",
      description: "Standard success. Response body contains the requested data.",
    },
    {
      code: 201,
      name: "Created",
      description:
        "Resource was successfully created. Location header typically contains the new resource URL.",
    },
    {
      code: 202,
      name: "Accepted",
      description:
        "Request accepted for processing, but processing is not yet complete. Used for async operations.",
    },
    {
      code: 203,
      name: "Non-Authoritative Information",
      description:
        "Success, but the response has been transformed or modified by a proxy, not the origin server.",
    },
    {
      code: 204,
      name: "No Content",
      description:
        "Request succeeded with no response body. Common for DELETE operations or empty PUT responses.",
    },
    {
      code: 205,
      name: "Reset Content",
      description:
        "Request succeeded; client should reset the document view (e.g., clear a form field).",
    },
    {
      code: 206,
      name: "Partial Content",
      description:
        "Server is delivering only part of the resource in response to a Range request. Used for resumable downloads.",
    },
    {
      code: 207,
      name: "Multi-Status",
      description:
        "Multiple status codes may be appropriate. Response body contains an XML document with individual statuses. (WebDAV)",
    },
    {
      code: 208,
      name: "Already Reported",
      description:
        "Members of a WebDAV binding were already enumerated in a previous part of the multistatus response. (WebDAV)",
    },
    {
      code: 226,
      name: "IM Used",
      description:
        "Server fulfilled a GET request and the response is the result of one or more instance manipulations.",
    },
  ],

  "3xx": [
    {
      code: 300,
      name: "Multiple Choices",
      description:
        "Multiple representations of the resource exist; the client or user should choose one.",
    },
    {
      code: 301,
      name: "Moved Permanently",
      description:
        "Resource has permanently moved to the URL in the Location header. Browsers and search engines update their references.",
    },
    {
      code: 302,
      name: "Found",
      description:
        "Resource is temporarily at a different URL. Clients should continue using the original URL for future requests.",
    },
    {
      code: 303,
      name: "See Other",
      description:
        "Response can be found at another URL via GET. Commonly used to redirect after a POST (PRG pattern).",
    },
    {
      code: 304,
      name: "Not Modified",
      description:
        "Conditional GET: resource has not changed since the last request. Client may use its cached version.",
    },
    {
      code: 307,
      name: "Temporary Redirect",
      description:
        "Temporary redirect. Unlike 302, the client must use the same HTTP method for the redirected request.",
    },
    {
      code: 308,
      name: "Permanent Redirect",
      description:
        "Permanent redirect. Unlike 301, the client must use the same HTTP method — method must not change.",
    },
  ],

  "4xx": [
    {
      code: 400,
      name: "Bad Request",
      description:
        "Server cannot process the request due to malformed syntax, invalid framing, or deceptive routing.",
    },
    {
      code: 401,
      name: "Unauthorized",
      description:
        "Authentication is required and has failed or not been provided. Response must include a WWW-Authenticate header.",
    },
    {
      code: 402,
      name: "Payment Required",
      description:
        "Reserved for future use. Informally used by APIs to indicate payment or a subscription is required.",
    },
    {
      code: 403,
      name: "Forbidden",
      description:
        "Server understood the request but refuses to authorize it. Unlike 401, re-authenticating will not help.",
    },
    {
      code: 404,
      name: "Not Found",
      description:
        "Requested resource does not exist. May also be returned instead of 403 to conceal a resource's existence.",
    },
    {
      code: 405,
      name: "Method Not Allowed",
      description:
        "The HTTP method is known but not supported for this resource. Response must include an Allow header.",
    },
    {
      code: 406,
      name: "Not Acceptable",
      description:
        "No content matches the criteria in the request's Accept headers. Server cannot produce an acceptable response.",
    },
    {
      code: 407,
      name: "Proxy Authentication Required",
      description:
        "Client must authenticate with the proxy before this request can be processed.",
    },
    {
      code: 408,
      name: "Request Timeout",
      description:
        "Server timed out waiting for the full request. The client may retry the request.",
    },
    {
      code: 409,
      name: "Conflict",
      description:
        "Request conflicts with the current state of the resource — e.g., concurrent updates or version mismatches.",
    },
    {
      code: 410,
      name: "Gone",
      description:
        "Resource has been permanently deleted and will not be available again. More definitive than 404.",
    },
    {
      code: 411,
      name: "Length Required",
      description:
        "Server requires a Content-Length header on the request but none was provided.",
    },
    {
      code: 412,
      name: "Precondition Failed",
      description:
        "One or more conditional request headers (If-Match, If-Unmodified-Since, etc.) evaluated to false.",
    },
    {
      code: 413,
      name: "Content Too Large",
      description:
        "Request body exceeds the size the server is willing or able to process.",
    },
    {
      code: 414,
      name: "URI Too Long",
      description:
        "The request URI is longer than the server is willing to interpret.",
    },
    {
      code: 415,
      name: "Unsupported Media Type",
      description:
        "The Content-Type of the request body is not supported by the server for this endpoint.",
    },
    {
      code: 416,
      name: "Range Not Satisfiable",
      description:
        "The Range header cannot be fulfilled — the specified range falls outside the size of the resource.",
    },
    {
      code: 417,
      name: "Expectation Failed",
      description:
        "The expectation set in the Expect request header could not be met by the server.",
    },
    {
      code: 418,
      name: "I'm a Teapot",
      description:
        "Any attempt to brew coffee with a teapot should result in this error. Defined as an April Fools' joke in RFC 2324.",
    },
    {
      code: 421,
      name: "Misdirected Request",
      description:
        "Request was directed at a server that is not able to produce a response for that combination of scheme and authority.",
    },
    {
      code: 422,
      name: "Unprocessable Content",
      description:
        "Request is well-formed but contains semantic errors — e.g., validation failures in a REST API body.",
    },
    {
      code: 423,
      name: "Locked",
      description: "The resource is currently locked and cannot be modified. (WebDAV)",
    },
    {
      code: 424,
      name: "Failed Dependency",
      description:
        "Request failed because it depended on another request that also failed. (WebDAV)",
    },
    {
      code: 425,
      name: "Too Early",
      description:
        "Server is unwilling to risk processing a request that might be replayed during TLS early data.",
    },
    {
      code: 426,
      name: "Upgrade Required",
      description:
        "Client must switch to a different protocol. Server sends an Upgrade header specifying the required protocol.",
    },
    {
      code: 428,
      name: "Precondition Required",
      description:
        "Request must be conditional to prevent lost updates. Server requires If-Match or similar headers.",
    },
    {
      code: 429,
      name: "Too Many Requests",
      description:
        "Rate limit exceeded. Response may include a Retry-After header indicating when to try again.",
    },
    {
      code: 431,
      name: "Request Header Fields Too Large",
      description:
        "Server is unwilling to process the request because one or more headers are too large.",
    },
    {
      code: 451,
      name: "Unavailable For Legal Reasons",
      description:
        "Resource cannot legally be provided in this jurisdiction. Named after Fahrenheit 451.",
    },
  ],

  "5xx": [
    {
      code: 500,
      name: "Internal Server Error",
      description:
        "Generic catch-all for unexpected server-side failures. Use a more specific 5xx if one fits.",
    },
    {
      code: 501,
      name: "Not Implemented",
      description:
        "Server does not support the functionality required to fulfill the request.",
    },
    {
      code: 502,
      name: "Bad Gateway",
      description:
        "Server acting as a gateway or proxy received an invalid response from the upstream server.",
    },
    {
      code: 503,
      name: "Service Unavailable",
      description:
        "Server is temporarily unable to handle the request — maintenance or overload. May include Retry-After.",
    },
    {
      code: 504,
      name: "Gateway Timeout",
      description:
        "Server acting as a gateway or proxy did not receive a timely response from an upstream server.",
    },
    {
      code: 505,
      name: "HTTP Version Not Supported",
      description:
        "The HTTP version used in the request is not supported by the server.",
    },
    {
      code: 506,
      name: "Variant Also Negotiates",
      description:
        "Transparent content negotiation for the request results in a circular reference.",
    },
    {
      code: 507,
      name: "Insufficient Storage",
      description:
        "Server cannot store the representation needed to complete the request. (WebDAV)",
    },
    {
      code: 508,
      name: "Loop Detected",
      description:
        "Server detected an infinite loop while processing the request. (WebDAV)",
    },
    {
      code: 510,
      name: "Not Extended",
      description:
        "Further extensions to the request are required for the server to fulfill it.",
    },
    {
      code: 511,
      name: "Network Authentication Required",
      description:
        "Client must authenticate to gain network access — typically a Wi-Fi captive portal.",
    },
  ],
};
