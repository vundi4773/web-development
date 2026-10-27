    Primary DB ──replicates──> Read replicas

    (metadata)                 (feed queries)



## Components

- CDN: serves photos from servers near users, so images load fast

  and our servers are not overloaded by 2,500 feed views per second.

- Object storage: cheap, durable home for hundreds of terabytes of files.

- Load balancer: spreads API traffic and removes failed servers.

- App servers (stateless): handle API requests; add more as traffic grows.

- Cache: keeps each user's prepared feed in memory for fast scrolling.

- Primary database: the source of truth for users, follows and photo metadata.

- Read replicas: handle the heavy feed queries, protecting the primary.

- Queue + thumbnail worker: creates thumbnails in the background so

  the upload request can finish quickly.



## Upload flow

1. The app sends the photo to an app server through the load balancer.

2. The app server checks the user's token and the file type and size.

3. It saves the original file to object storage.

4. It inserts a row with the photo's metadata into the primary database.

5. It adds a job "make thumbnail for photo 123" to the queue.

6. It replies 201 Created to the user straight away.

7. A worker takes the job, creates the 50 KB thumbnail, saves it to

   object storage and updates the photo's row with the thumbnail URL.

8. The followers' cached feeds are invalidated so the photo appears.



## Trade-offs

1. Speed vs freshness: feeds come from the cache, so a new photo may

   take a few seconds to appear for followers. This is acceptable for

   a social app and greatly reduces database load.

2. Simplicity vs speed of upload: thumbnails are made in the background.

   For a moment the photo has no thumbnail, and the app shows a

   placeholder, but uploads stay fast even during busy periods.

3. Cost: CDN and object storage cost money per gigabyte, but they are

   far cheaper and more reliable than storing and serving hundreds of

   terabytes from our own servers.

Step 3 - Check your reasoning. The most important insight is separating large files (object storage plus CDN) from small structured data (the database). This pattern is used by almost every app that handles images, video or documents. The second insight is moving slow work (thumbnails) into a queue so the user gets a fast response.

Step 4 - Commit and push.

Terminal   (bash)

git add .

git commit -m "Day 7 assignment"

git push