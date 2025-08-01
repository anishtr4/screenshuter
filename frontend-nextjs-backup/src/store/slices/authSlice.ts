import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User, UserLimits } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  limits: UserLimits | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  limits: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; token: string; limits?: UserLimits }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      if (action.payload.limits) {
        state.limits = action.payload.limits
      }
    },
    setLimits: (state, action: PayloadAction<UserLimits>) => {
      state.limits = action.payload
    },
    clearAuth: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.limits = null
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
})

export const { setAuth, setLimits, clearAuth, updateUser } = authSlice.actions
export default authSlice.reducer
