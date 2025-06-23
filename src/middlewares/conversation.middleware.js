import Conversation from '../db/conversation.model.js'

// check if conversation is exist
export const checkConversationStatus = async (request, response, next) => {
  // get post id from request params
  const { id } = request.params
  try {
    // check if conversation id is missing
    if (!id) {
      return response.status(400).json({ message: 'Conversation ID is missing' })
    }

    // get conversation by id
    const post = await Conversation.findById(id)
    if (!post) {
      return response.status(400).json({ message: 'Conversation does not exist' })
    }

    // continue to next middleware
    return next()
  } catch (error) {
    console.log(error)
    return response.status(400).json({ error: `Error: ${error}` })
  }
}
