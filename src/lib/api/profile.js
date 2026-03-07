import { supabase } from '@/lib/supabase'

/**
 * Get current user profile
 */
export const getCurrentProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('getCurrentProfile failed:', error)
    throw error
  }
}

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 */
export const updateProfile = async (profileData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('updateProfile failed:', error)
    throw error
  }
}

/**
 * Change user password
 * @param {string} newPassword - New password
 */
export const changePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('changePassword failed:', error)
    throw error
  }
}

/**
 * Update user email
 * @param {string} newEmail - New email address
 */
export const changeEmail = async (newEmail) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('changeEmail failed:', error)
    throw error
  }
}

/**
 * Upload profile avatar
 * @param {File} file - Avatar image file
 */
export const uploadAvatar = async (file) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath)

    // Update profile with avatar URL
    await updateProfile({ avatar_url: publicUrl })

    return publicUrl
  } catch (error) {
    console.error('uploadAvatar failed:', error)
    throw error
  }
}
