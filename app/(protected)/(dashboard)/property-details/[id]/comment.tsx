'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getComments } from '@/lib/actions';

interface Reply {
    id: string;
    author: string;
    avatar?: string;
    message: string;
}

interface Comment {
    id: string;
    author: string;
    authorAvatar?: string;
    date: string | Date;
    message: string;
    replies: Reply[];
}

export function Comments({ propertyId }: { propertyId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        if (!propertyId) return;
        try {
            setLoading(true);
            const data = await getComments(propertyId);
            console.log(data)
            if (data && Array.isArray(data.data)) {
                setComments(data.data.map((c: any) => {
                    const authorName = c.user
                        ? `${c.user.first_name || ''} ${c.user.last_name || ''}`.trim() || c.user.email
                        : c.author || 'Anonymous';

                    return {
                        id: c.id,
                        author: authorName,
                        authorAvatar: c.user?.avatar || c.authorAvatar || '',
                        date: c.created_at || c.date || new Date(),
                        message: c.comment || c.message || '',
                        replies: (c.replies || []).map((r: any) => ({
                            id: r.id,
                            author: r.user ? `${r.user.first_name || ''} ${r.user.last_name || ''}`.trim() || r.user.email : r.author || 'Anonymous',
                            avatar: r.user?.avatar || r.avatar || '',
                            message: r.comment || r.message || ''
                        }))
                    };
                }));
            } else {
                setComments(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [propertyId]);

    const formatDate = (date: string | Date) => {
        try {
            return format(new Date(date), 'PPP');
        } catch (e) {
            return 'Recently';
        }
    };

    if (loading && comments.length === 0) {
        return <div className="p-4 text-center text-sm text-muted-foreground">Loading comments...</div>;
    }

    return (
        <div className='p-4'>
            <div className="pt-1">
                <div className="space-y-4 mb-2">
                    {comments.length > 0 ? (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                                <Avatar className="size-7 mt-0.5">
                                    <AvatarImage src={comment.authorAvatar} />
                                    <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div
                                                className="font-medium text-foreground text-sm hover:text-primary"
                                            >
                                                {comment.author}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(comment.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="text-xs">{comment.message}</p>
                                    </div>
                                    {comment.replies.length > 0 && (
                                        <div className="ml-8 space-y-3">
                                            {comment.replies.map((reply) => (
                                                <div key={reply.id} className="flex gap-2">
                                                    <Avatar className="size-5">
                                                        <AvatarImage src={reply.avatar} />
                                                        <AvatarFallback>
                                                            {reply.author.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 space-y-1">
                                                        <Link
                                                            href="#"
                                                            className="text-sm text-foreground font-medium hover:text-primary"
                                                        >
                                                            {reply.author}
                                                        </Link>
                                                        <div className="bg-muted/30 p-2 rounded-md">
                                                            <p className="text-xs">{reply.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground">No comments yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
