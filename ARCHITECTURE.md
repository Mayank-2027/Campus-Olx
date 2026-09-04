# Campus OLX - Distributed Microservices Architecture & Technical Documentation

Campus OLX is an enterprise-grade college marketplace platform engineered with a backend-focused microservices architecture, distributed caching layer, asynchronous event-driven messaging, and containerized orchestration.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    Client["🌐 React + Vite Single Page Application (Port 3000)"]
    Gateway["🛡️ Express API Gateway (Port 5000)"]

    Client -->|HTTP REST / WebSockets| Gateway

    subgraph Microservices Cluster
        AuthSvc["🔐 Auth Service (Port 5001)"]
        ProductSvc["📦 Product Service (Port 5002)"]
        ChatSvc["💬 Chat Service + Socket.IO (Port 5003)"]
        NotifSvc["🔔 Notification Service (Port 5004)"]
    end

    Gateway -->|Forward /api/auth & /api/users| AuthSvc
    Gateway -->|Forward /api/products, /reports, /admin| ProductSvc
    Gateway -->|Forward /api/chats & /socket.io| ChatSvc
    Gateway -->|Forward /api/notifications| NotifSvc

    subgraph Data & Infrastructure Layer
        MongoDB[("🍃 MongoDB Database")]
        Redis[("⚡ Redis Cache & View Counter")]
        RabbitMQ["🐇 RabbitMQ Topic Exchange (campus_olx_events)"]
    end

    AuthSvc -->|Read/Write User Data| MongoDB
    ProductSvc -->|Read/Write Product Data| MongoDB
    ProductSvc <-->|Cache-Aside / Invalidation| Redis
    ChatSvc -->|Persist Chat Messages| MongoDB

    AuthSvc -->|Publish USER_REGISTERED| RabbitMQ
    ProductSvc -->|Publish PRODUCT_CREATED| RabbitMQ
    ChatSvc -->|Publish MESSAGE_SENT| RabbitMQ

    RabbitMQ -->|Consume Events| NotifSvc
    NotifSvc -->|Store Audit Logs| MongoDB
```

---

## 2. Service Communication Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Client App
    participant Gateway as API Gateway (5000)
    participant ProductSvc as Product Service (5002)
    participant Redis as Redis Cache (6379)
    participant RabbitMQ as RabbitMQ Broker (5672)
    participant NotifSvc as Notification Service (5004)

    User->>Gateway: POST /api/products (Create Listing)
    Gateway->>ProductSvc: Proxy Request (JWT Header)
    ProductSvc->>ProductSvc: Validate & Upload Images to Cloudinary
    ProductSvc->>ProductSvc: Write Product to MongoDB
    ProductSvc->>Redis: Invalidate Cache (products:list:*)
    ProductSvc->>RabbitMQ: Publish PRODUCT_CREATED Event
    ProductSvc-->>Gateway: Return HTTP 201 (Product Object)
    Gateway-->>User: HTTP 201 Created

    note over RabbitMQ, NotifSvc: Asynchronous Processing (Decoupled)
    RabbitMQ->>NotifSvc: Consume PRODUCT_CREATED Message
    NotifSvc->>NotifSvc: Persist Audit Record & Send Email/Alert
```

---

## 3. Docker Architecture Diagram

```mermaid
graph LR
    subgraph Docker Host Container Network (campus-network)
        FE["campusolx-frontend (Nginx Port 3000 -> 80)"]
        GW["campusolx-api-gateway (Port 5000)"]
        
        AS["campusolx-auth-service (Port 5001)"]
        PS["campusolx-product-service (Port 5002)"]
        CS["campusolx-chat-service (Port 5003)"]
        NS["campusolx-notification-service (Port 5004)"]

        MDB[("campusolx-mongodb (Port 27017)")]
        RDS[("campusolx-redis (Port 6379)")]
        RMQ["campusolx-rabbitmq (Port 5672 / 15672)"]
    end

    FE -->|Proxy /api| GW
    GW --> AS
    GW --> PS
    GW --> CS
    GW --> NS

    AS --> MDB
    PS --> MDB
    CS --> MDB
    NS --> MDB

    PS <--> RDS
    AS --> RMQ
    PS --> RMQ
    CS --> RMQ
    RMQ --> NS
```

---

## 4. Redis Caching Flow & Lifecycle

```mermaid
flowchart TD
    Req["GET /api/products request"] --> KeyGen["Generate Cache Key: products:list:<query_hash>"]
    KeyGen --> RedisCheck{"Check Redis for Key"}

    RedisCheck -- "Cache HIT" --> ReturnCache["Return Cached JSON (Header: X-Cache: HIT)"]
    RedisCheck -- "Cache MISS" --> QueryDB["Query MongoDB Database"]
    QueryDB --> SaveCache["Store in Redis (TTL: 300s)"]
    SaveCache --> ReturnDB["Return Fresh JSON (Header: X-Cache: MISS)"]

    subgraph Invalidation Lifecycle
        Mutation["Product Created / Updated / Deleted"] --> ClearCache["Call invalidateProductCache()"]
        ClearCache --> SCAN["Scan & Del 'products:list:*' & 'products:detail:<id>'"]
    end
```

---

## 5. RabbitMQ Event-Driven Flow

```mermaid
flowchart LR
    subgraph Publishers
        Auth["Auth Service"]
        Prod["Product Service"]
        Chat["Chat Service"]
    end

    Ex["Exchange: campus_olx_events (Topic)"]

    subgraph Consumers
        NotifQueue["Queue: notification_service_queue"]
        NotifWorker["Notification Worker"]
    end

    Auth -->|USER_REGISTERED| Ex
    Prod -->|PRODUCT_CREATED| Ex
    Chat -->|MESSAGE_SENT| Ex

    Ex -->|Routing Key Match| NotifQueue
    NotifQueue --> NotifWorker
    NotifWorker --> SendEmail["Send Email Notification & Audit Record"]
```

---

## 6. Technology Deep-Dive & Placement Interview Guide

### 1. Docker & Containerization

- **Why it was added**: Solves "works on my machine" issues and provides exact, reproducible development and production environments across all 8 microservices and databases.
- **Problem it solves**: Eliminates manual software dependency installation (Node, MongoDB, Redis, RabbitMQ) and port conflicts.
- **Key Benefits**: Multi-stage builds reduce image size; custom Docker Compose bridge network isolates inter-service traffic.
- **Interview Talking Point**:
  > *"We used Docker Compose to orchestrate 8 microservice containers including multi-stage Nginx static serving for React/Vite, Node.js runtime containers, and persistent volume mounts for MongoDB, Redis, and RabbitMQ."*

---

### 2. Redis Caching Layer

- **Why it was added**: Offloads repeat read traffic from MongoDB and optimizes response time for popular product listings.
- **Problem it solves**: High database load during traffic spikes and slow query execution for unindexed filter queries.
- **Key Benefits**: Sub-millisecond response latency, cache-aside pattern with TTL, sorted-set view tracking (`zincrby`), and targeted pattern invalidation on mutations.
- **Interview Talking Point**:
  > *"We implemented a Cache-Aside pattern using Redis. Read requests first hit Redis using deterministic query hashes as keys with a 5-minute TTL. On write operations (create/update/delete), we perform pattern-based invalidation across product list and detail cache keys to maintain strong eventual consistency."*

---

### 3. Microservice Architecture & API Gateway

- **Why it was added**: Decouples domain logic into independently scalable, isolated microservices (Auth, Product, Chat, Notification).
- **Problem it solves**: Monolithic tight-coupling where a failure in chat or notification processing could crash the entire application.
- **Key Benefits**: Independent deployments, domain separation, centralized security/rate-limiting via an Express API Gateway.
- **Interview Talking Point**:
  > *"We decoupled our backend monolith into 5 microservices. The API Gateway acts as a single entrypoint handling CORS, centralized logging, and reverse-proxying requests to specialized downstream services using http-proxy-middleware."*

---

### 4. RabbitMQ Event-Driven Architecture

- **Why it was added**: Enables asynchronous, non-blocking inter-service messaging for background tasks like sending emails and auditing.
- **Problem it solves**: Prevents long HTTP response delays caused by synchronous email sending or cross-service HTTP REST calls.
- **Key Benefits**: Topic Exchange routing, message persistence, consumer prefetching, and complete decoupling between publishers and consumers.
- **Interview Talking Point**:
  > *"We introduced RabbitMQ with a Topic Exchange (`campus_olx_events`). When events like `USER_REGISTERED` or `PRODUCT_CREATED` occur, publishing services emit event payloads asynchronously. The Notification Service consumes these messages out-of-band without blocking user HTTP requests."*

---

### 5. Structured Logging & Observability (Winston + Morgan)

- **Why it was added**: Replaces plain `console.log` statements with structured JSON logs formatted with timestamps, log levels, and service metadata.
- **Problem it solves**: Difficulty in diagnosing runtime errors in distributed multi-container microservice deployments.
- **Key Benefits**: Separate log files (`access.log`, `error.log`, `combined.log`), Morgan HTTP request metrics, and console transport with color coding.
- **Interview Talking Point**:
  > *"We integrated Winston and Morgan to create a centralized logging utility across all microservices. Every HTTP request generates access logs, while system warnings and unhandled exceptions are captured in level-specific file transports for rapid root-cause diagnosis."*
