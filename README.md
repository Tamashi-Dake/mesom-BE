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
  - [x] Block / Unblock user
  - [x] View user
  - [x] View Posts of user (user posts, shared posts)
  - [x] View Replies of user (user posts, replies)
  - [x] View Medias of user (user posts with image)
  - [x] View Likes of user (liked posts)
  - [ ] View Followers/Following of user
  - [x] Search users by username/display name

- [ ] Settings

  - [ ] View Blocked users of user
  - [x] Route
    - [x] Get settings
    - [x] Update settings
  - [ ] Notifications preferences
    - [ ] block notifications from specific user
    - [x] block notifications from specific type
    - [x] block notifications from specific post
  - [x] Change theme
    - [x] Change theme color
    - [x] Change accent color

- [ ] Posts ( preview image (use URL.createObjectURL))

  - [x] Create post
  - [x] Read post
  - [x] Read all posts (pagination)
  - [x] Read replies of post
  - [ ] Update post (only for Premium users)
  - [x] Delete post (soft Delete)
  - [x] Like post
  - [x] Share post
  - [x] Bookmark post
  - [x] View post
  - [ ] Tags
  - [ ] Search posts by tags
  - [ ] Pin post

- [ ] Real-time Message

  - [x] Conversation
    - [x] CRU
    - [x] Hide conversation with user
    - [x] Block user
    - [x] Search conversation
  - [ ] Message
    - [x] CR
      - [x] Send Direct Message (If user isn't in group && user isn't blocked)
      - [ ] Hide messages from blocked users in group -> Add getBlockedUsers route
    - [ ] Retrieve message (hide content, delete images)
    - [ ] React to message
    - [ ] Reply to message -> Add getMessage/:id route

- [ ] Limit api request (express-rate-limit)
- [ ] Add cron job to clean up notifications (item is hidden or deleted)

#### Models

- [x] Users
- [x] Settings
- [x] Notifications
- [x] Posts / Replies
- [x] Views
- [ ] Tags
- [x] Conversations
- [x] Messages

#### Middlewares

- [x] Check Auth
- [x] Check User Status (id exists)
- [x] Check Post Status (id exists)
- [x] Check Settings before sending notification
- [ ] Check Premium User

#### More

- [ ] Auto taggings images (with Cloudinary)
