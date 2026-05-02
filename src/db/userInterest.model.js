import mongoose from 'mongoose'

const userInterestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    // Map<tagId (string) → accumulated weight>
    tagWeights: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  { timestamps: true }
)

userInterestSchema.index({ userId: 1 }, { unique: true })

const UserInterest = mongoose.model('UserInterest', userInterestSchema)

export default UserInterest
