import mongoose from 'mongoose'

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 50
    },
    postCount: { type: Number, default: 0 }
  },
  { timestamps: true }
)

tagSchema.index({ name: 1 }, { unique: true })
tagSchema.index({ postCount: -1 })

const Tag = mongoose.model('Tag', tagSchema)

export default Tag
