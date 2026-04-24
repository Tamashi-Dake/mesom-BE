import {
  getCurrentUser,
  login,
  logout,
  refresh,
  register,
  updatePassword
} from '../controller/authentication.controller.js'
import { isAuthenticated, validateOrigin } from '../middlewares/index.js'

export default (router) => {
  router.get('/auth/me', isAuthenticated, getCurrentUser)
  router.post('/auth/register', validateOrigin, register)
  router.post('/auth/login', validateOrigin, login)
  router.post('/auth/logout', validateOrigin, logout)
  router.post('/auth/refresh', validateOrigin, refresh)
  router.patch('/password', validateOrigin, isAuthenticated, updatePassword)
}
