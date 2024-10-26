## Mesom - Backend

### TODO

#### Features

- [ ] Authentication

  - [x] Register
  - [x] Login
  - [x] Login with Google
  - [x] Logout
  - [ ] Refresh token
  - [ ] Forgot password
  - [ ] Reset password
  - [x] Change password
  - [ ] Change email
  - [ ] Delete account (might use soft delete)

    - [ ] delete user settings
    - [ ] casade delete related posts
    - [ ] casade delete related notifications

- [x] Suggested users (except followed users, based on friends of friends ) (need to check again when create more users)
- [ ] Notifications ( read/unread, soft delete, toggle setting for each type of notification )

  - [x] Create notification (follow, like, reply, share)
  - [x] Check user settings before sending notification (follow, like, reply, share)
  - [x] Read notification
    - [x] Mark notification as read
    - [x] Mark all notifications as read
  - [x] Delete notification

    - [x] Mark notification as deleted
    - [x] Mark all notifications as deleted
    - [x] Set TTL for notification
    - [ ] Update cronjob

  - [ ] Debounce notifications to prevent spam

- [ ] User

  - [x] Update profile
  - [x] Follow / Unfollow user
  - [ ] Block / Unblock user
  - [x] View user
  - [x] View Posts of user (user posts, shared posts)
  - [ ] View Replies of user (user posts, replies)
  - [ ] View Media of user (user posts with image)
  - [x] View Likes of user (liked posts)

- [ ] Settings

  - [x] Route
    - [x] Get settings
    - [x] Update settings
  - [ ] Notifications preferences
    - [ ] block notifications from specific user
    - [x] block notifications from specific type
    - [x] block notifications from specific post
  - [ ] Change theme
    - [ ] Change theme color
    - [ ] Change accent color

- [ ] Posts ( preview image (use URL.createObjectURL))

  - [x] Create post
  - [x] Read post
  - [x] Read all posts (pagination)
  - [x] Read replies of post
  - [ ] Update post (only for Premium users)
  - [ ] Delete post - OR - set Post as Deleted -> just need to filter in get Posts
    - [ ] casade delete replies
    - [ ] remove related notifications
    - [ ] blockedPost in user Setting
    - [ ] user Bookmark
    - [ ] update related documents
  - [x] Like post
  - [x] Share post
  - [x] View post
  - [ ] Tags

- [ ] Limit api request (express-rate-limit)
- [ ] Add cron job to clean up notifications (item is hiden or deleted)

- [ ] Admin account
  - [ ] check deleted Post (only Admin can see deleted Post)
  - [ ] Delete any Post

#### Models

- [x] Users
- [x] Settings
- [x] Notifications
- [x] Posts / Replies
- [x] Views
- [ ] Tags
- [ ] Conversations
- [ ] Messages

#### Middlewares

- [x] Check Auth
- [x] Check User Status (id exists)
- [x] Check Post Status (id exists)
- [x] Check Settings before sending notification
- [ ] Check Owner of Post
- [ ] Check Premium User

#### More

- [ ] User page (Tabs: Posts (Post and Shared Post), Replies (also include Posts), Media(Post with Image), Likes(Liked Posts))
- [ ] Search (Users, Tags)
- [ ] Auto taggings images (with Cloudinary)
