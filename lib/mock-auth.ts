// Mock authentication for development/testing
interface MockUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'customer'
}

const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'admin@webmall.lk',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: '2', 
    email: 'customer@webmall.lk',
    name: 'Customer User',
    role: 'customer'
  }
]

// Store passwords separately (in real app, these would be hashed)
const mockPasswords: Record<string, string> = {
  'admin@webmall.lk': 'password123',
  'customer@webmall.lk': 'password123'
}

export function mockSignIn(email: string, password: string): Promise<MockUser> {
  console.log('Mock auth: Starting sign in for', email)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('Mock auth: Processing sign in...')
      const user = mockUsers.find(u => u.email === email)
      const storedPassword = mockPasswords[email]
      
      console.log('Mock auth: User found:', user)
      console.log('Mock auth: Password check:', password === storedPassword)
      
      if (!user) {
        console.log('Mock auth: User not found')
        reject(new Error('User not found'))
        return
      }
      
      if (!storedPassword || password !== storedPassword) {
        console.log('Mock auth: Invalid password')
        reject(new Error('Invalid password'))
        return
      }

      // Store in localStorage for session management
      console.log('Mock auth: Storing user in localStorage')
      localStorage.setItem('user', JSON.stringify(user))
      console.log('Mock auth: Sign in successful')
      resolve(user)
    }, 500) // Small delay to simulate network
  })
}

export function mockSignUp(email: string, password: string, name: string): Promise<MockUser> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if user already exists
      if (mockUsers.find(u => u.email === email)) {
        reject(new Error('User already exists'))
        return
      }

      // Create new user
      const newUser: MockUser = {
        id: String(mockUsers.length + 1),
        email,
        name,
        role: email.includes('admin') ? 'admin' : 'customer'
      }
      
      // Store the password
      mockPasswords[email] = password
      
      mockUsers.push(newUser)
      localStorage.setItem('user', JSON.stringify(newUser))
      resolve(newUser)
    }, 500)
  })
}

export function mockGetCurrentUser(): MockUser | null {
  if (typeof window === 'undefined') return null
  
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export function mockSignOut(): void {
  localStorage.removeItem('user')
  window.location.reload()
}
