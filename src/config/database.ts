import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const uri =
  "mongodb+srv://root:root@w9-day4-hw.1svfisj.mongodb.net/?retryWrites=true&w=majority&appName=W9-Day4-hw"

const clientOptions = {
  serverApi: {
    version: "1" as const,
    strict: true,
    deprecationErrors: true,
  },
}

export const run = async (): Promise<void> => {
  try {
    await mongoose.connect(uri, clientOptions)
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().command({ ping: 1 })
      console.log(
        "Pinged your deployment. You successfully connected to MongoDB!"
      )
    } else {
      console.log("Connected to MongoDB successfully!")
    }
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}
