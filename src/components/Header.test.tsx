import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './Header';

vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Mock the hooks
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

const mockUser = {
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  username: 'testuser',
};

const mockLogout = vi.fn();

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({
    user: mockUser,
  }),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
    isAuthenticated: true,
    user: { id: 'user-1', email: 'test@example.com', user_metadata: {} },
    savedAccounts: [],
    switchAccount: vi.fn(),
    updateAccountProfile: vi.fn(),
  }),
}));

describe('Header', () => {
  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
  };

  it('renders correctly', () => {
    renderHeader();
    expect(screen.getAllByPlaceholderText(/Search Anime, Manga.../i)[0]).toBeDefined();
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getAllByText('Create')[0]).toBeDefined();
  });

  it('handles search input', () => {
    renderHeader();
    const input = screen.getAllByPlaceholderText(/Search Anime, Manga.../i)[0];
    fireEvent.change(input, { target: { value: 'Naruto' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockNavigate).toHaveBeenCalledWith('/?q=Naruto');
  });

  it('opens create menu', () => {
    renderHeader();
    const createBtn = screen.getAllByText('Create')[0];
    fireEvent.click(createBtn);
    expect(screen.getByText('Create Idea Pin')).toBeDefined();
  });
});
