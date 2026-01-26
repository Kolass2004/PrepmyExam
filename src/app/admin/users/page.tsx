"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, AlertCircle, Search, MoreVertical, ShieldAlert, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">User Management</h1>
                <button onClick={fetchUsers} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search users by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-secondary/30 text-xs font-bold uppercase text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4">Last Login</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {titleCase(filteredUsers.length === 0 && !loading) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                            {filteredUsers.map(u => (
                                <tr key={u.uid} className="hover:bg-secondary/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                                                {u.photoURL ? (
                                                    <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">
                                                        {(u.displayName || u.email || "?")[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-foreground">{u.displayName || "Unknown User"}</div>
                                                <div className="text-sm text-muted-foreground">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.disabled ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-bold border border-red-500/20">
                                                <XCircle className="w-3.5 h-3.5" /> Disabled
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-bold border border-green-500/20">
                                                <CheckCircle className="w-3.5 h-3.5" /> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {u.metadata.creationTime ? format(new Date(u.metadata.creationTime), "MMM d, yyyy") : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {u.metadata.lastSignInTime ? format(new Date(u.metadata.lastSignInTime), "MMM d, yyyy HH:mm") : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleUserStatus(u.uid, u.disabled)}
                                                disabled={actionLoading === u.uid}
                                                className={cn(
                                                    "p-2 rounded-lg transition-colors border",
                                                    u.disabled
                                                        ? "border-green-500/30 text-green-600 hover:bg-green-500/10"
                                                        : "border-red-500/30 text-red-600 hover:bg-red-500/10"
                                                )}
                                                title={u.disabled ? "Enable Account" : "Disable Account"}
                                            >
                                                {actionLoading === u.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                                            </button>

                                            <Link href={`/admin/users/${u.uid}`} className="p-2 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground">
                                                <Eye className="w-4 h-4" />
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

function titleCase(condition: boolean) {
    return condition;
}
