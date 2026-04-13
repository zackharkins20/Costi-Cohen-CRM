import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    // Authenticate the requesting user
    const supabase = await createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the requesting user is an Admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', authUser.id)
      .single()

    if (!currentUser || currentUser.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })
    }

    // Parse request body
    const { email, full_name, role, temporary_password } = await request.json()

    if (!email || !full_name || !role || !temporary_password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['Agent', 'Admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Create the auth user via Admin API
    const adminClient = getSupabaseAdmin()
    const { data: newAuthUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: temporary_password,
      email_confirm: true,
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // The on_auth_user_created trigger auto-creates a public.users row.
    // Update it with the provided role and full_name.
    // Small delay to allow the trigger to fire.
    await new Promise(resolve => setTimeout(resolve, 500))

    const { error: updateError } = await adminClient
      .from('users')
      .update({ role, full_name })
      .eq('auth_id', newAuthUser.user.id)

    if (updateError) {
      console.error('Failed to update user record:', updateError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newAuthUser.user.id,
        email: newAuthUser.user.email,
        full_name,
        role,
      },
    })
  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
