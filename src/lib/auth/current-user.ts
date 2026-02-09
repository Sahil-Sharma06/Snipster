import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Get the current authenticated user from the database
 * Returns null if not authenticated or user not found in database
 */
export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  return user
}

/**
 * Get the current authenticated user from the database
 * Throws an error if not authenticated
 */
export async function requireUser() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Get the Clerk user object (useful for getting user details before they're synced to DB)
 */
export async function getClerkUser() {
  return await currentUser()
}

/**
 * Get the current user's Clerk ID (useful for quick auth checks)
 */
export async function getCurrentUserId() {
  const { userId } = await auth()
  return userId
}
