import express from 'express'
// Migrated to NestJS — src/modules/auth (Phase 2.1)
// import authentication from './authentication.route.js'
// Migrated to NestJS — src/modules/user (Phase 2.2)
// import users from './user.route.js'
import post from './post.route.js'
import notification from './notification.route.js'
import conversation from './conversation.route.js'
import search from './search.route.js'
import setting from './setting.route.js'
import alive from './stayAlive.route.js'
import message from './message.route.js'

const router = express.Router()

export default () => {
  // authentication(router)  // migrated to NestJS
  // users(router)            // migrated to NestJS
  post(router)
  notification(router)
  conversation(router)
  message(router)
  setting(router)
  search(router)
  alive(router)
  return router
}
