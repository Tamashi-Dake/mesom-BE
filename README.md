## Mesom - Backend

### TODO

<!-- features -->

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
  - [ ] Create notification
    - [ ] when user follow
    - [x] when user like
    - [ ] when user reply
    - [x] when user share
  - [ ] Check user settings before sending notification
    - [ ] when user follow
    - [ ] when user like
    - [ ] when user reply
    - [ ] when user share
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
    - [ ] block notifications from specific type
    - [ ] block notifications from specific post
  - [ ] Change theme
    - [ ] Change theme color
    - [ ] Change accent color

- [ ] Posts ( preview image (use URL.createObjectURL))

  - [x] Create post
  - [x] Read post
  - [x] Read all posts (pagination)
  - [x] Read replies of post
  - [ ] Update post (only for Premium users)
  - [ ] Delete post
    - [ ] casade delete replies
    - [ ] remove related notifications,
    - [ ] update related documents
  - [x] Like post
  - [x] Share post
  - [x] View post
  - [ ] Tags

- [ ] User settings ( theme, email notifications, etc )

<!-- models -->

- [x] Users
- [x] Settings
- [x] Notifications
- [x] Posts / Replies
- [x] Views
- [ ] Tags
- [ ] Conversations
- [ ] Messages

<!-- Middleware -->

- [x] Check Auth
- [x] Check User Status (id exists)
- [x] Check Post Status (id exists)
- [ ] Check Settings before sending notification
- [ ] Check Owner of Post
- [ ] Check Premium User

<!-- More -->

- [ ] User page (Tabs: Posts (Post and Shared Post), Replies (also include Posts), Media(Post with Image), Likes(Liked Posts))
- [ ] Search (Users, Posts, Tags)
- [ ] Auto taggings images (with Cloudinary)
