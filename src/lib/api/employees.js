import { supabase } from '@/lib/supabase'

/**
 * Get all employees
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status
 */
export const getEmployees = async (options = {}) => {
  try {
    let query = supabase
      .from('employees')
      .select('*')
      .order('full_name', { ascending: true })

    if (options.status) {
      query = query.eq('status', options.status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('getEmployees failed:', error)
    throw error
  }
}

/**
 * Get single employee by ID
 * @param {string} id - Employee ID
 */
export const getEmployee = async (id) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('getEmployee failed:', error)
    throw error
  }
}

/**
 * Create a new employee
 * @param {Object} employeeData - Employee data
 */
export const createEmployee = async (employeeData) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('createEmployee failed:', error)
    throw error
  }
}

/**
 * Update an employee
 * @param {string} id - Employee ID
 * @param {Object} employeeData - Updated employee data
 */
export const updateEmployee = async (id, employeeData) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .update(employeeData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('updateEmployee failed:', error)
    throw error
  }
}

/**
 * Delete an employee
 * @param {string} id - Employee ID
 */
export const deleteEmployee = async (id) => {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('deleteEmployee failed:', error)
    throw error
  }
}

/**
 * Generate unique employee code
 */
export const generateEmployeeCode = async () => {
  try {
    // Get last employee code
    const { data, error } = await supabase
      .from('employees')
      .select('employee_code')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error

    let nextNumber = 1
    if (data && data.length > 0 && data[0].employee_code) {
      const lastCode = data[0].employee_code
      const match = lastCode.match(/EMP(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    return `EMP${String(nextNumber).padStart(4, '0')}`
  } catch (error) {
    console.error('generateEmployeeCode failed:', error)
    // Fallback to timestamp-based code
    return `EMP${Date.now().toString().slice(-6)}`
  }
}

/**
 * Create auth account for employee
 * @param {string} employee_id - Employee ID
 * @param {boolean} send_sms - Whether to send password via SMS
 */
export const createEmployeeAuth = async (employee_id, send_sms = false) => {
  try {
    // Get employee details
    const employee = await getEmployee(employee_id)

    if (!employee.email) {
      throw new Error('Çalışan email adresi olmalı')
    }

    if (employee.profile_id) {
      throw new Error('Çalışanın zaten giriş hesabı var')
    }

    // Generate random password
    const password = Math.random().toString(36).slice(-8) +
                     Math.random().toString(36).slice(-8).toUpperCase() + '123!'

// Create admin client with service role key
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    )

    // Create auth user
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: employee.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: employee.full_name,
        role: 'employee'
      }
    })

    if (createError) {
      console.error('Auth creation error:', createError)
      throw new Error(`Failed to create auth user: ${createError.message}`)
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: employee.email,
        full_name: employee.full_name,
        role: 'employee',
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    // Update employee with profile_id
    const { error: updateError } = await supabase
      .from('employees')
      .update({ profile_id: authUser.user.id })
      .eq('id', employee_id)

    if (updateError) {
      console.error('Employee link error:', updateError)
      throw new Error(`Failed to link employee: ${updateError.message}`)
    }

    return {
      success: true,
      email: employee.email,
      full_name: employee.full_name,
      password,
      profile_id: authUser.user.id,
      message: 'Employee account created successfully'
    }
  } catch (error) {
    console.error('createEmployeeAuth failed:', error)
    throw error
  }
}

/**
 * Send password to employee via SMS
 * @param {string} employee_id - Employee ID
 * @param {string} password - Password to send
 */
export const sendEmployeePassword = async (employee_id, password) => {
  try {
    const employee = await getEmployee(employee_id)

    if (!employee.phone) {
      throw new Error('Çalışanın telefon numarası yok')
    }

    // Import SMS module dynamically
    const { sendSMS } = await import('./sms')

    const message = `Giriş bilgileriniz:\nEmail: ${employee.email}\nŞifre: ${password}\n\nLuma Yazılım Hizmetleri`

    await sendSMS(employee.phone, message)

    return { success: true, message: 'SMS gönderildi' }
  } catch (error) {
    console.error('sendEmployeePassword failed:', error)
    throw error
  }
}
