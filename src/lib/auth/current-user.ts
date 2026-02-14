import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Get the current authenticated user from the database
 * Returns null if not authenticated or user not found in database
 * If user is authenticated but not in DB, creates the user record
 */
export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  // If user doesn't exist in DB, create from Clerk data
  if (!user) {
    try {
      const clerkUser = await currentUser()
      
      if (clerkUser) {
        const email = clerkUser.emailAddresses[0]?.emailAddress
        const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null

        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email: email || '',
            name: name,
            image: clerkUser.imageUrl,
            username: clerkUser.username || null,
          },
        })
      }
    } catch (error) {
      console.error('Error creating user from Clerk data:', error)
      return null
    }
  }

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
