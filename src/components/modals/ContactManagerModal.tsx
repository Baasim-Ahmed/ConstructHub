'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ContactManagerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function ContactManagerModal({ open, onOpenChange, onSuccess }: ContactManagerModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'CLIENT_CONTACT',
                    payload: {
                        title: formData.subject,
                        description: formData.message,
                        timestamp: new Date().toISOString()
                    }
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send message');
            }

            toast.success('Message sent to manager');
            if (onSuccess) onSuccess();
            onOpenChange(false);
            setFormData({ subject: '', message: '' });
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Contact Manager</DialogTitle>
                    <DialogDescription>
                        Send a message or request to your project manager. They will receive a notification.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            required
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="e.g. Schedule Update, Material Question"
                        />
                    </div>
                    <div>
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                            id="message"
                            required
                            rows={5}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Describe your request or question here..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Message'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
