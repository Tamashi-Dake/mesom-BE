import express from 'express'
// Migrated to NestJS — src/modules/auth (Phase 2.1)
// import authentication from './authentication.route.js'
// Migrated to NestJS — src/modules/user (Phase 2.2)
// import users from './user.route.js'
// Migrated to NestJS — src/modules/notification (Phase 2.3)
// import notification from './notification.route.js'
// Migrated to NestJS — src/modules/setting (Phase 2.4)
// import setting from './setting.route.js'
// Migrated to NestJS — src/modules/post (Phase 2.5)
// import post from './post.route.js'
// Migrated to NestJS — src/modules/search (Phase 2.6)
// import search from './search.route.js'
// Migrated to NestJS — src/modules/conversation (Phase 2.7 + 2.8)
// import conversation from './conversation.route.js'
// import message from './message.route.js'
import alive from './stayAlive.route.js'

const router = express.Router()

export default () => {
  // authentication(router)  // migrated to NestJS
  // users(router)            // migrated to NestJS
  // notification(router)     // migrated to NestJS
  // setting(router)          // migrated to NestJS
  // post(router)             // migrated to NestJS
  // search(router)           // migrated to NestJS
  // conversation(router)     // migrated to NestJS
  // message(router)          // migrated to NestJS
  alive(router)
  return router
}
