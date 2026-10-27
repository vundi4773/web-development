# SnapShare: Scaling Plan

SnapShare is a photo-sharing app. Users upload photos and scroll a feed of photos from people they follow.

## 1. Assumptions

| Item | Value |
|---|---|
| Registered users | 10,000,000 |
| Daily active share | 10% |
| Uploads per active user per day | 1 photo |
| Feed pages viewed per active user per day | 50 |
| Average photo size | 2 MB |
| Thumbnail size | 50 KB (one per photo) |
| Seconds in a day | 86,400 |
| Peak factor | 5x the average |
| Units | Decimal (1 TB = 1,000,000 MB) |

**Daily active users (DAU)** = 10,000,000 x 10% = **1,000,000**

## 2. Estimates

### Uploads per second
- Uploads per day = 1,000,000 x 1 = 1,000,000
- Average = 1,000,000 / 86,400 = **about 11.6 uploads/s**
- Peak (5x) = **about 58 uploads/s**

### Feed views per second
- Feed views per day = 1,000,000 x 50 = 50,000,000
- Average = 50,000,000 / 86,400 = **about 579 views/s**
- Peak (5x) = **about 2,900 views/s**

### Photo storage per year
- Per photo = 2 MB original + 0.05 MB thumbnail = 2.05 MB
- Per day = 1,000,000 x 2.05 MB = 2.05 TB (2 TB originals + 50 GB thumbnails)
- Per year = 2.05 TB x 365 = **about 748 TB, roughly 0.75 PB**
  - Originals: about 730 TB
  - Thumbnails: about 18 TB

### Extra figure: upload bandwidth
- Average = 11.6 x 2 MB = about 23 MB/s (about 185 Mbps)
- Peak = about 116 MB/s (about 930 Mbps)

## 3. Read-heavy or write-heavy?

**SnapShare is read-heavy.** There are 50,000,000 feed views against 1,000,000 uploads per day, a read-to-write ratio of about **50:1**. The real gap is wider, because each feed page loads several thumbnails. If we assume about 10 thumbnails per page, that is roughly 500 million image fetches per day, about 5,800 per second on average.

What this means for the design:
- **Optimise the read path first.** Put a CDN in front of images and a cache in front of the database.
- **Scale reads horizontally.** Use read replicas and stateless app servers behind a load balancer.
- **Keep writes simple and safe.** A single primary database can handle about 58 writes/s at peak. Heavy work such as thumbnails goes to a background queue.
- **Accept slightly stale reads.** A feed that is a few seconds old is fine, which makes aggressive caching possible.

## 4. Why photos must not live in the database

- **Size and cost.** Storing about 750 TB of binary blobs per year in a database is very expensive. Database storage is premium, fast storage meant for small structured rows.
- **Performance.** Large blobs bloat tables and indexes, slow backups and replication, and fill the buffer cache with photo bytes instead of the hot rows that queries need.
- **Scaling.** Database connections and I/O would be spent streaming images. Object storage and a CDN are built for this and scale almost without limit.
- **Missing features.** Object storage gives cheap per-GB pricing, built-in durability, lifecycle tiers and direct delivery over HTTP. The database does not.

**Where they go instead:** photo files (originals and thumbnails) go in **object storage** (such as S3 or GCS). The database stores only **metadata**: photo ID, owner, caption, timestamp, the object-storage key and the status.

## 5. Architecture diagram

```
                      Users (mobile app / web)
                               |
             +-----------------+------------------+
             | image GETs                         | API calls (upload, feed)
             v                                    v
        +---------+                       +---------------+
        |   CDN   |                       | Load Balancer |
        +---------+                       +---------------+
             | cache miss                         |
             |                       +------------+------------+
             |                       v            v            v
             |                  +---------+  +---------+  +---------+
             |                  |  App    |  |  App    |  |  App    |
             |                  | Server 1|  | Server 2|  | Server N|   (stateless)
             |                  +---------+  +---------+  +---------+
             |                       |  |
             |        +--------------+  +------------------------+
             |        | read feed/metadata                        | enqueue "make thumbnail" job
             |        v                                           v
             |   +---------+  miss   +---------------------+   +---------+
             |   |  Cache  |-------->|  Database           |   |  Queue  |
             |   | (Redis) |         |  Primary (writes)   |   +---------+
             |   +---------+         |        |            |        |
             |                       |        | replication|        v
             |                       |        v            |   +-----------------+
             |                       |  Read Replica(s)    |   | Thumbnail       |
             |                       |  (feed/metadata     |   | Worker(s)       |
             |                       |   reads)            |   +-----------------+
             |                       +---------------------+        |  ^
             |                                                      |  | read original
             |                                                      v  | write thumbnail
             |                                         +-------------------------+
             +---------------------------------------->|     Object Storage      |
                  (CDN pulls files on miss)            | originals + thumbnails  |
                                                       +-------------------------+
                          ^
                          | client uploads the original directly
                          | with a presigned URL (see upload flow)
                       Users
```

## 6. Components in one sentence each

- **CDN:** serves photos and thumbnails from edge servers near the user, which cuts latency and keeps the huge image read load off our servers.
- **Load balancer:** spreads incoming requests across many app servers and routes around unhealthy ones, so no single server is a bottleneck or single point of failure.
- **App servers:** run the stateless API logic (auth, upload requests, feed building), so we can add more servers to handle more traffic.
- **Cache (Redis):** keeps hot data such as feed pages and photo metadata in memory, so most reads never reach the database.
- **Database primary:** is the source of truth for users, follows and photo metadata, and handles all writes consistently.
- **Read replica:** holds a copy of the primary and serves read queries, so the 50:1 read load is spread away from the primary.
- **Object storage:** stores the large photo files cheaply and durably at petabyte scale, with direct HTTP access.
- **Queue:** holds thumbnail jobs so uploads return quickly and traffic spikes are absorbed without losing work.
- **Thumbnail worker:** pulls jobs from the queue and creates the 50 KB thumbnail in the background, so the upload request never waits for image processing.

## 7. Upload flow, step by step

1. The user picks a photo in the app and taps **Post**.
2. The client sends an "I want to upload" request (with auth token, file type and size) through the **load balancer** to an **app server**.
3. The app server validates the user, file type and size limit (for example, 2 MB).
4. The app server writes a metadata row to the **database primary** with status `processing`, and generates a unique object key.
5. The app server returns a short-lived **presigned upload URL** for that key.
6. The client uploads the original photo **directly to object storage** with that URL, so 2 MB files never pass through our app servers.
7. When the upload completes, the client (or a storage event) tells the app server, which puts a job `{photo_id, object_key}` on the **queue**.
8. A **thumbnail worker** takes the job, downloads the original, makes a 50 KB thumbnail and writes it to **object storage**.
9. The worker updates the database row with the thumbnail key and status `ready`. It then invalidates or updates the relevant **cache** entries.
10. Followers see the photo the next time their feed loads. The images are fetched through the **CDN**, which pulls from object storage on the first request and caches them afterwards.

**Failure handling:** if a worker crashes mid-job, the queue redelivers the job. Thumbnail creation is idempotent (same input, same output key), so retries are safe. If a photo stays `processing` for too long, the app can retry or show the original.

## 8. Trade-offs

1. **Caching speed vs freshness.** Caching feeds makes them fast and cheap, but users may see slightly stale content (a new photo can appear seconds late). Short TTLs and invalidation on upload reduce this, at the cost of more complexity and more database load.
2. **Read replicas vs consistency.** Replicas scale reads, but replication lag means a user might upload a photo and not see it right away. We can read from the primary for the user's own recent actions, which gives up some of the replica offload.
3. **Async thumbnails vs instant availability.** A queue and worker keep uploads fast and resilient, but the thumbnail appears a few seconds later and the system gains moving parts to monitor. The alternative, generating thumbnails inside the upload request, is simpler but slower and fragile under load.
4. **Presigned direct upload vs proxying through app servers.** Direct upload saves bandwidth and server load, but we have less control (virus scanning, content checks) at upload time. We need an after-upload validation step.
5. **CDN cost vs latency.** A CDN gives much lower latency and offloads most image traffic, but it adds per-GB cost and cache invalidation concerns. At this read volume the savings on origin load make it worthwhile.
6. **Feed generation (fan-out on read vs on write).** Building the feed when the user opens it (on read) is simple and cheap on writes but slower per view. Precomputing feeds when someone posts (on write) is faster to read but expensive for users with millions of followers. For the stated 50:1 read ratio, on-write or a hybrid is worth considering later.
