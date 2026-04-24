import mongoose from 'mongoose'
import { getUserById } from '../db/user.model.js'
import Post from '../db/post.model.js'
import Setting from '../db/setting.model.js'
import { verifyAccessToken } from '../util/jwt.js'

const getAllowedOrigin = () =>
  process.env.NODE_ENV === 'production' ? process.env.PROD_FRONTEND_URL : process.env.DEV_FRONTEND_URL

export const isAuthenticated = (request, response, next) => {
  const token = request.cookies['mesom-access']
  if (!token) {
    return response.status(401).json({ error: true, message: 'Unauthorized' })
  }
  try {
    request.identify = verifyAccessToken(token)
    return next()
  } catch {
    return response.status(401).json({ error: true, message: 'Token invalid or expired' })
  }
}

export const validateOrigin = (request, response, next) => {
  if (request.headers.origin !== getAllowedOrigin()) {
    return response.status(403).json({ error: true, message: 'Forbidden origin' })
  }
  return next()
}

// check if post is exist
export const checkPostStatus = async (request, response, next) => {
  // get post id from request params
  const { id } = request.params
  try {
    // check if post id is missing
    if (!id) {
      return response.status(400).json({ message: 'Post ID is missing' })
    }

    // get post by id
    const post = await Post.findById(id)
    if (!post) {
      return response.status(400).json({ message: 'Post does not exist' })
    }

    // continue to next middleware
    return next()
  } catch (error) {
    console.log(error)
    return response.status(400).json({ error: `Error: ${error}` })
  }
}

// check if user is exist
export const checkUserStatus = async (request, response, next) => {
  // get user id from request params
  const userId = request.params.id
  try {
    // check if user id is missing
    if (!userId) {
      return response.status(400).json({ message: 'User ID is missing' })
    }

    // get user by id
    const user = await getUserById(userId)
    if (!user) {
      return response.status(400).json({ message: 'User does not exist' })
    }

    // continue to next middleware
    return next()
  } catch (error) {
    console.log(error)
    return response.status(400).json({ error: true, message: `Error: ${error}` })
  }
}

//TODO: check if user is the owner of the resource

// Middleware để kiểm tra nếu request.params.id là một ObjectId hợp lệ
export const checkValidObjectId = (request, response, next) => {
  const { id } = request.params
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    // Nếu id không hợp lệ, trả về lỗi 400
    return response.status(400).json({
      error: true,
      message: `"${id}" is not a valid ID`
    })
  }
  // Nếu id hợp lệ, tiếp tục xử lý
  next()
}

// Middleware to check user settings
export const checkUserNotificationSettings = async (request, response, next) => {
  // Get the user or author ID from the request object
  const id = request.params.id // might be the user ID or the post ID
  let userId = id // default to the ID from the request params
  const { notificationType } = request.body
  if (!notificationType) return response.status(400).json({ error: 'Notification type is required' })
  try {
    // if id is post id, get the author id
    const post = await Post.findById(id)
    if (post) userId = post.author

    // Fetch user settings
    const userSettings = await Setting.findOne({ user: userId })
    if (!userSettings) {
      return response.status(404).json({ error: 'User settings not found' })
    }

    // Check if notifications.blockedType are enabled and notification.blockedPosts contains the post ID
    const isTypeBlocked = !userSettings.notificationPreferences.blockedType[notificationType]
    const isPostBlocked = userSettings.notificationPreferences.blockedPost.includes(id)

    // If the user has blocked the notification type or post, set a flag in the request object
    if (isTypeBlocked || isPostBlocked) {
      request.blockedNotification = true
    }

    // Continue to the next middleware or route handler
    next()
  } catch (error) {
    console.error('Error checking user settings:', error)
    return response.status(500).json({ error: 'Server error' })
  }
}
