import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data

    const email = email_addresses[0]?.email_address
    const name = [first_name, last_name].filter(Boolean).join(' ') || null
    let userName = username || null

    try {
      await prisma.user.create({
        data: {
          clerkId: id,
          email: email,
          name: name,
          image: image_url,
          username: userName,
        },
      })
    } catch (error: any) {
      // Handle username uniqueness constraint error
      if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
        // Generate unique username by appending timestamp
        const uniqueUsername = userName 
          ? `${userName}_${Date.now().toString().slice(-6)}`
          : `user_${id.slice(-8)}`
        
        await prisma.user.create({
          data: {
            clerkId: id,
            email: email,
            name: name,
            image: image_url,
            username: uniqueUsername,
          },
        })
      } else if (error.code === 'P2002' && error.meta?.target?.includes('clerkId')) {
        // User already exists, skip creation
        console.log(`User with clerkId ${id} already exists`)
      } else {
        throw error
      }
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data

    const email = email_addresses[0]?.email_address
    const name = [first_name, last_name].filter(Boolean).join(' ') || null
    let userName = username || null

    try {
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: email,
          name: name,
          image: image_url,
          username: userName,
        },
      })
    } catch (error: any) {
      // Handle username uniqueness constraint error on update
      if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
        // Generate unique username by appending timestamp
        const uniqueUsername = userName 
          ? `${userName}_${Date.now().toString().slice(-6)}`
          : `user_${id.slice(-8)}`
        
        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: email,
            name: name,
            image: image_url,
            username: uniqueUsername,
          },
        })
      } else if (error.code === 'P2025') {
        // User doesn't exist, log and skip
        console.log(`User with clerkId ${id} not found for update`)
      } else {
        throw error
      }
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    if (id) {
      try {
        await prisma.user.delete({
          where: { clerkId: id },
        })
      } catch (error: any) {
        // Handle case where user doesn't exist
        if (error.code === 'P2025') {
          console.log(`User with clerkId ${id} not found for deletion`)
        } else {
          throw error
        }
      }
    }
  }

  return new Response('', { status: 200 })
}
