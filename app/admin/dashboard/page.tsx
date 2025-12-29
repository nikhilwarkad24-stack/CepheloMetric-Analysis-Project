'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromStorage, type UserData } from '@/lib/auth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogOut, Settings, Shield, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface AdminUser {
  _id: string;
  email: string;
  name: string;
  photoURL: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verify auth with server first (since middleware already allows access if valid)
    // This ensures we have fresh user data and proper auth verification
    const verifyAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          // If server says not authenticated, redirect
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.user?.role !== 'admin') {
          // If not admin, redirect to home
          router.push('/');
          return;
        }
        // Auth verified and user is admin
        setUser(data.user);
        fetchUsers();
      } catch (error) {
        console.error('Auth verification failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    verifyAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    setIsTogglingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'PATCH' });
      if (res.ok) {
        const data = await res.json();
        setUsers(users.map(u => u._id === userId ? { ...u, isActive: data.user.isActive } : u));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    } finally {
      setIsTogglingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [users, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const currentPageUsers = filteredUsers.slice(pageStart, pageStart + pageSize);

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toast({ title: 'No users to export', description: 'Adjust your search or filters and try again.' });
      return;
    }
    const csvRows = [['ID', 'Name', 'Email', 'Role', 'Status', 'CreatedAt']];
    filteredUsers.forEach(u => {
      csvRows.push([u._id, u.name, u.email, u.role, u.isActive ? 'Active' : 'Inactive', u.createdAt]);
    });
    const csvContent = csvRows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Export started', description: 'CSV download should begin shortly.' });
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            <span className="text-lg font-bold tracking-tight text-foreground">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer h-8 w-8">
                    <AvatarImage src={user.photoURL} alt={user.name} />
                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="font-semibold text-sm">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage all users and their account status</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{users.filter(u => !u.isActive).length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 w-full md:max-w-md">
                  <Input placeholder="Search users by name or email..." value={searchQuery} onChange={(e) => { setSearchQuery((e.target as HTMLInputElement).value); setPage(1); }} />
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Per page:</label>
                  <select className="input px-2 py-1 rounded border" value={pageSize} onChange={(e) => { setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(1); }}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPageUsers.map((u) => (
                        <TableRow key={u._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={u.photoURL} alt={u.name} />
                                <AvatarFallback className="text-xs">{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{u.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>
                              {u.role === 'admin' ? (
                                <>
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <UserIcon className="w-3 h-3 mr-1" />
                                  User
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.isActive ? 'default' : 'secondary'}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={u.isActive ? 'destructive' : 'default'}
                              size="sm"
                              onClick={() => handleToggleStatus(u._id)}
                              disabled={isTogglingId === u._id || u._id === user.id}
                              title={u._id === user.id ? "You can't deactivate your own account" : ''}
                            >
                              {isTogglingId === u._id ? 'Processing...' : u.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">Showing {pageStart + 1} - {Math.min(pageStart + pageSize, filteredUsers.length)} of {filteredUsers.length} users</div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                      <div className="text-sm">Page {currentPage} / {totalPages}</div>
                      <Button size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
