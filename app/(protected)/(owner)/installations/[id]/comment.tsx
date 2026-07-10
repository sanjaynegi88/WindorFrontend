'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getComments, postComments } from '@/lib/actions';
import { toast } from 'sonner';
import { useUser } from '@/components/providers/user-provider';

interface Comment {
    id: string;
    author: string;
    authorAvatar?: string;
    date: string | Date;
    message: string;
}

export function Comments({ propertyId }: { propertyId: string }) {
    const { user: currentUser } = useUser();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = async () => {
        if (!propertyId) return;
        try {
            setLoading(true);
            const data = await getComments(propertyId);
            if (data && Array.isArray(data.data)) {
                setComments(data.data.map((c: any) => {
                    // Use email as author name as requested
                    const authorName = c.user?.email || c.author || 'Anonymous';

                    return {
                        id: c.id,
                        author: authorName,
                        authorAvatar: c.user?.avatar || c.authorAvatar || '',
                        date: c.created_at || c.date || new Date(),
                        message: c.comment || c.message || '',
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

    const handleAdd = async () => {
        if (!input.trim() || !propertyId) return;
        setIsSubmitting(true);
        const result = await postComments({ comment: input.trim() }, propertyId);
        setIsSubmitting(false);
        if (!result.success) {
            toast.error(result.message || 'Failed to post comment');
            return;
        }
        toast.success('Comment posted');
        setInput('');
        fetchComments();
    };

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
                                            <Link
                                                href={`mailto:${comment.author}`}
                                                className="font-medium text-foreground text-sm hover:text-primary"
                                            >
                                                {comment.author}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(comment.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="text-xs">{comment.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground">No comments yet. Be the first to comment!</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <Avatar className="size-7">
                        <AvatarFallback>{currentUser?.email?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <Input
                        variant="sm"
                        className="flex-1 text-sm"
                        placeholder="Write your comment..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAdd();
                            }
                        }}
                        disabled={isSubmitting}
                    />
                    <Button variant="primary" size="sm" onClick={handleAdd} disabled={!input.trim() || isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Send'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
