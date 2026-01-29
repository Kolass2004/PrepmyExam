"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, AlertCircle, Search, MoreVertical, ShieldAlert, CheckCircle, XCircle, Eye, RefreshCw, User } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    disabled: boolean;
    metadata: {
        creationTime: string;
        lastSignInTime: string;
    };
}

export default function AdminUsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const router = useRouter();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/admin/users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            } else {
                console.error("Failed to fetch users");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchUsers();
        }
    }, [user]);

    const toggleUserStatus = async (uid: string, currentStatus: boolean) => {
        setActionLoading(uid);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ uid, disabled: !currentStatus })
            });

            if (res.ok) {
                // Update local state
                setUsers(users.map(u => u.uid === uid ? { ...u, disabled: !currentStatus } : u));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        User Management
                        <span className="text-lg font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                            {users.length}
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">View and manage registered users</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="p-3 bg-secondary/50 hover:bg-secondary rounded-full transition-colors self-start md:self-center"
                    title="Refresh List"
                >
                    <RefreshCw className={cn("w-6 h-6", loading && "animate-spin")} />
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-2xl">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Search className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <input
                    type="text"
                    placeholder="Search users by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-card border border-border/50 rounded-[2rem] outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all font-medium text-lg placeholder:text-muted-foreground/50 shadow-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-secondary/20 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                            <tr>
                                <th className="px-8 py-6">User</th>
                                <th className="px-6 py-6">Status</th>
                                <th className="px-6 py-6">Created</th>
                                <th className="px-6 py-6">Last Login</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredUsers.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                                                <User className="w-8 h-8 opacity-50" />
                                            </div>
                                            <p className="text-lg font-medium">No users found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filteredUsers.map(u => (
                                <tr key={u.uid} className="hover:bg-secondary/20 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                                {u.photoURL ? (
                                                    <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground text-lg">
                                                        {(u.displayName || u.email || "?")[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground text-base">{u.displayName || "Unknown User"}</div>
                                                <div className="text-sm text-muted-foreground font-medium">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {u.disabled ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-bold border border-red-500/20 uppercase tracking-wide">
                                                <XCircle className="w-4 h-4" /> Disabled
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-xs font-bold border border-green-500/20 uppercase tracking-wide">
                                                <CheckCircle className="w-4 h-4" /> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-muted-foreground">
                                        {u.metadata.creationTime ? format(new Date(u.metadata.creationTime), "MMM d, yyyy") : "-"}
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-muted-foreground">
                                        {u.metadata.lastSignInTime ? format(new Date(u.metadata.lastSignInTime), "MMM d, yyyy • HH:mm") : "-"}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleUserStatus(u.uid, u.disabled)}
                                                disabled={actionLoading === u.uid}
                                                className={cn(
                                                    "p-2.5 rounded-xl transition-colors border",
                                                    u.disabled
                                                        ? "border-green-500/30 text-green-600 hover:bg-green-500/10"
                                                        : "border-red-500/30 text-red-600 hover:bg-red-500/10"
                                                )}
                                                title={u.disabled ? "Enable Account" : "Disable Account"}
                                            >
                                                {actionLoading === u.uid ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                                            </button>

                                            <Link
                                                href={`/admin/users/${u.uid}`}
                                                className="p-2.5 rounded-xl border border-border/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
