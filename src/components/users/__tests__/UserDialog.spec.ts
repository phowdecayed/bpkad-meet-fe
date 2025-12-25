import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import UserDialog from '@/components/users/UserDialog.vue'
import { useUsersStore } from '@/stores/users'
import { Button } from '@/components/ui/button'

const mockRoles = [
  { id: 1, name: 'admin' },
  { id: 2, name: 'user' },
]

const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  roles: [{ id: 2, name: 'user' }],
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  email_verified_at: '2025-01-01',
}

describe('UserDialog.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof UserDialog>>
  let store: ReturnType<typeof useUsersStore>

  beforeEach(() => {
    wrapper = mount(UserDialog, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              users: {
                users: [],
                isLoading: false,
              },
            },
          }),
        ],
        stubs: {
          Dialog: {
            template: '<div><slot /></div>',
          },
          DialogContent: {
            template: '<div><slot /></div>',
          },
          DialogHeader: {
            template: '<div><slot /></div>',
          },
          DialogTitle: {
            template: '<div><slot /></div>',
          },
          DialogDescription: {
            template: '<div><slot /></div>',
          },
          DialogFooter: {
            template: '<div><slot /></div>',
          },
          DialogClose: {
            template: '<div><slot /></div>',
          },
        },
      },
      props: {
        open: false,
        user: null,
        roles: mockRoles,
      },
    })
    store = useUsersStore()
  })

  it('renders create user form by default', async () => {
    await wrapper.setProps({ open: true })
    expect(wrapper.text()).toContain('Create User')
    expect((wrapper.find('input[id="name"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('input[id="email"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('input[id="password"]').exists()).toBe(true)
  })

  it('renders edit user form when user prop is provided', async () => {
    await wrapper.setProps({ user: mockUser })
    await wrapper.setProps({ open: true })
    expect(wrapper.text()).toContain('Edit User')
    expect((wrapper.find('input[id="name"]').element as HTMLInputElement).value).toBe(mockUser.name)
    expect((wrapper.find('input[id="email"]').element as HTMLInputElement).value).toBe(
      mockUser.email,
    )
    expect(wrapper.find('input[id="password"]').exists()).toBe(false)
  })

  it('validates form submission', async () => {
    await wrapper.setProps({ open: true })
    await wrapper.find('form').trigger('submit')

    const errorMessages = wrapper.findAll('.text-red-500')
    expect(errorMessages.length).toBeGreaterThan(0)
    expect(store.createUser).not.toHaveBeenCalled()
  })

  it('calls createUser when valid form is submitted in create mode', async () => {
    await wrapper.setProps({ open: true })
    await wrapper.find('input[id="name"]').setValue('Jane Doe')
    await wrapper.find('input[id="email"]').setValue('jane@example.com')
    await wrapper.find('input[id="password"]').setValue('password123')
    await wrapper.find('input[id="password_confirmation"]').setValue('password123')

    await wrapper.find('form').trigger('submit')

    expect(store.createUser).toHaveBeenCalledTimes(1)
    expect(store.createUser).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      role: 'user',
    })
  })

  it('calls updateUser when valid form is submitted in edit mode', async () => {
    await wrapper.setProps({ user: mockUser })
    await wrapper.setProps({ open: true })
    await wrapper.find('input[id="name"]').setValue('John Updated')

    await wrapper.find('form').trigger('submit')

    expect(store.updateUser).toHaveBeenCalledTimes(1)
    expect(store.updateUser).toHaveBeenCalledWith(
      mockUser.id,
      expect.objectContaining({
        name: 'John Updated',
        email: mockUser.email,
      }),
    )
  })

  it('calls sendPasswordReset in edit mode', async () => {
    await wrapper.setProps({ user: mockUser })
    await wrapper.setProps({ open: true })

    const buttons = wrapper.findAllComponents(Button)
    const resetButton = buttons.find((btn) => btn.text().includes('Send Password Reset'))

    expect(resetButton).toBeDefined()
    if (resetButton) {
      await resetButton.trigger('click')
    }

    expect(store.sendPasswordReset).toHaveBeenCalledWith(mockUser.email)
  })
})
